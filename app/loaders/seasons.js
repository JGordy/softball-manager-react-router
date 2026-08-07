import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

export async function getSeasonById({ seasonId, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    if (seasonId) {
        let season;
        let isArchiveView = false;

        // Try reading using user's client first
        try {
            season = await readDocument("seasons", seasonId, [], client);
        } catch (err) {
            // Fallback: check if they are a former player who participated in this season
            try {
                const { createAdminClient } = await import(
                    "@/utils/appwrite/server"
                );
                const adminClient = createAdminClient();

                // Get logged-in user ID
                const { account } = client;
                const user = await account.get();
                const userId = user?.$id;

                if (!userId) throw err;

                const response = await listDocuments(
                    "season_rosters",
                    [
                        Query.equal("seasonId", seasonId),
                        Query.equal("playerId", userId),
                        Query.limit(1),
                    ],
                    adminClient,
                );

                if (response.rows && response.rows.length > 0) {
                    const { readDocument: adminReadDocument } = await import(
                        "@/utils/databases"
                    );
                    season = await adminReadDocument(
                        "seasons",
                        seasonId,
                        [],
                        adminClient,
                    );
                    isArchiveView = true;
                } else {
                    throw err;
                }
            } catch (fallbackErr) {
                console.error("Access check failed for season:", fallbackErr);
                throw err;
            }
        }

        const activeClient = isArchiveView
            ? await import("@/utils/appwrite/server").then((m) =>
                  m.createAdminClient(),
              )
            : client;

        const rawTeamId =
            season.teamId ||
            (Array.isArray(season.teams) && season.teams[0]
                ? typeof season.teams[0] === "string"
                    ? season.teams[0]
                    : season.teams[0].$id
                : null);

        // Manually fetch teams since TablesDB doesn't auto-populate relationships
        if (rawTeamId) {
            season.teamId = rawTeamId;
            const team = await readDocument(
                "teams",
                rawTeamId,
                [],
                activeClient,
            ).catch(() => null);
            season.teams = team ? [team] : [];

            try {
                // Fetch managers
                const { teams } = await import("@/utils/appwrite/server").then(
                    (m) => m.createAdminClient(),
                );
                const memberships = await teams.listMemberships(rawTeamId);
                const managerIds = memberships.memberships
                    .filter(
                        (m) =>
                            m.roles.includes("manager") ||
                            m.roles.includes("owner"),
                    )
                    .map((m) => m.userId);

                if (season.teams[0]) {
                    season.teams[0].managerIds = managerIds;
                }
            } catch (e) {
                console.error("Error fetching managers for season details", e);
            }
        } else {
            season.teams = [];
        }

        // Manually fetch games for this season
        const gamesResponse = await listDocuments(
            "games",
            [
                Query.equal("seasons", seasonId),
                Query.limit(100), // Increase limit to get all games
            ],
            activeClient,
        );
        season.games = gamesResponse.rows || [];

        // Fetch team players and logs for stats aggregation
        let players = [];
        let teamPlayers = [];
        let logs = [];
        if (season.teamId) {
            try {
                const { getTeamById } = await import("@/loaders/teams");
                const teamInfo = await getTeamById({
                    teamId: season.teamId,
                    client: activeClient,
                });
                teamPlayers = teamInfo.players || [];

                // Fetch season-specific roster from database
                const { getSeasonRoster } = await import(
                    "@/actions/rosterHistory"
                );
                const seasonRoster = await getSeasonRoster({
                    seasonId,
                    client: activeClient,
                });
                const seasonPlayerIds = seasonRoster.map((r) => r.playerId);

                if (isArchiveView) {
                    // Hydrate players directly from user documents to include historical/former players
                    if (seasonPlayerIds.length > 0) {
                        const { listDocuments: listDocs } = await import(
                            "@/utils/databases"
                        );
                        const usersResponse = await listDocs(
                            "users",
                            [
                                Query.equal("$id", seasonPlayerIds),
                                Query.limit(100),
                            ],
                            activeClient,
                        );
                        players = usersResponse.rows || [];
                    }
                    teamPlayers = []; // Clear current roster to protect PII
                } else {
                    // Filter team players to only those who are on the season roster
                    players = teamPlayers.filter((p) =>
                        seasonPlayerIds.includes(p.$id),
                    );
                }

                const gameIds = season.games.map((g) => g.$id);
                if (gameIds.length > 0) {
                    logs = (teamInfo.teamLogs || []).filter((log) =>
                        gameIds.includes(log.gameId),
                    );
                }
            } catch (err) {
                console.error(
                    "Error fetching team players/logs for season stats:",
                    err,
                );
            }
        }

        let previousSeasonData = null;
        let targetTeamId = season.teamId;
        if (
            !targetTeamId &&
            Array.isArray(season.teams) &&
            season.teams.length > 0
        ) {
            const firstTeam = season.teams[0];
            targetTeamId =
                typeof firstTeam === "string" ? firstTeam : firstTeam?.$id;
        }
        if (!targetTeamId && season.games && season.games.length > 0) {
            targetTeamId = season.games[0].teamId;
        }

        if (targetTeamId) {
            previousSeasonData = await getPreviousSeasonSummary({
                teamId: targetTeamId,
                currentSeasonId: seasonId,
                client: activeClient,
            });
        }

        return {
            season,
            players,
            teamPlayers,
            logs,
            isArchiveView,
            previousSeasonData,
        };
    } else {
        return {
            season: {},
            players: [],
            teamPlayers: [],
            logs: [],
            isArchiveView: false,
            previousSeasonData: null,
        };
    }
}

/**
 * Fetch lightweight summary statistics for a team's previous season.
 *
 * @param {Object} params - Input parameters
 * @param {string} params.teamId - Team ID
 * @param {string} params.currentSeasonId - Current season ID to compare against
 * @param {Object} [params.client] - Appwrite client
 * @returns {Object|null} Previous season info, games, and logs if found
 */
export async function getPreviousSeasonSummary({
    teamId,
    currentSeasonId,
    client: _client,
}) {
    if (!teamId || !currentSeasonId) return null;
    try {
        const { createAdminClient } = await import("@/utils/appwrite/server");
        const adminClient = createAdminClient();

        // 1. Query seasons specifically for this team (bypassing global DB limit)
        const [byTeamId, byTeamsArr] = await Promise.all([
            listDocuments(
                "seasons",
                [Query.equal("teamId", teamId), Query.limit(100)],
                adminClient,
            ).catch(() => ({ rows: [] })),
            listDocuments(
                "seasons",
                [Query.equal("teams", teamId), Query.limit(100)],
                adminClient,
            ).catch(() => ({ rows: [] })),
        ]);

        // Merge & deduplicate by $id
        const seasonsMap = new Map();
        [...(byTeamId.rows || []), ...(byTeamsArr.rows || [])].forEach((s) => {
            if (s && s.$id) seasonsMap.set(s.$id, s);
        });
        const fetchedTeamSeasons = Array.from(seasonsMap.values());

        const teamSeasons = fetchedTeamSeasons.sort((a, b) => {
            const timeA = new Date(
                a.startDate || a.created_at || a.$createdAt || 0,
            ).getTime();
            const timeB = new Date(
                b.startDate || b.created_at || b.$createdAt || 0,
            ).getTime();
            return timeB - timeA;
        });

        const currIndex = teamSeasons.findIndex(
            (s) => s.$id === currentSeasonId,
        );
        let prevSeason = null;
        if (currIndex !== -1 && currIndex + 1 < teamSeasons.length) {
            prevSeason = teamSeasons[currIndex + 1];
        } else if (teamSeasons.length > 1) {
            prevSeason = teamSeasons.find((s) => s.$id !== currentSeasonId);
        }

        if (!prevSeason) return null;

        // 2. Fetch games for previous season with broad matching
        const allGamesRes = await listDocuments(
            "games",
            [Query.limit(500)],
            adminClient,
        ).catch(() => ({ rows: [] }));

        const prevGames = (allGamesRes.rows || []).filter((g) => {
            if (g.seasons === prevSeason.$id || g.seasonId === prevSeason.$id)
                return true;
            if (Array.isArray(g.seasons)) {
                return g.seasons.some((s) =>
                    typeof s === "string"
                        ? s === prevSeason.$id
                        : s?.$id === prevSeason.$id,
                );
            }
            if (g.teamId === teamId && g.gameDate) {
                const gTime = new Date(g.gameDate).getTime();
                const sStart = new Date(prevSeason.startDate || 0).getTime();
                const sEnd = new Date(prevSeason.endDate || 0).getTime();
                if (sStart && sEnd && gTime >= sStart && gTime <= sEnd)
                    return true;
            }
            return false;
        });

        const prevGameIds = prevGames.map((g) => g.$id);

        let prevLogs = [];
        if (prevGameIds.length > 0) {
            const logsRes = await listDocuments(
                "game_logs",
                [Query.equal("gameId", prevGameIds), Query.limit(1000)],
                adminClient,
            ).catch(() => ({ rows: [] }));
            prevLogs = logsRes.rows || [];
        }

        return {
            season: prevSeason,
            games: prevGames,
            logs: prevLogs,
            allPreviousSeasons: teamSeasons.filter(
                (s) => s.$id !== currentSeasonId,
            ),
        };
    } catch (err) {
        console.error("Error loading previous season summary:", err);
        return null;
    }
}
