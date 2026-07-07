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

        // Manually fetch teams since TablesDB doesn't auto-populate relationships
        if (season.teamId) {
            const team = await readDocument(
                "teams",
                season.teamId,
                [],
                activeClient,
            ).catch(() => null);
            season.teams = team ? [team] : [];

            try {
                // Fetch managers
                const { teams } = await import("@/utils/appwrite/server").then(
                    (m) => m.createAdminClient(),
                );
                const memberships = await teams.listMemberships(season.teamId);
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

        return { season, players, teamPlayers, logs, isArchiveView };
    } else {
        return {
            season: {},
            players: [],
            teamPlayers: [],
            logs: [],
            isArchiveView: false,
        };
    }
}
