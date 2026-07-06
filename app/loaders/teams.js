import { Query } from "node-appwrite";
import { DateTime } from "luxon";
import { listDocuments, readDocument } from "@/utils/databases";
import { createAdminClient } from "@/utils/appwrite/server";

export async function getUserTeams({ client, isDashboard = false }) {
    try {
        // Get authenticated user from session
        const { account, teams } = client;
        const user = await account.get();
        const userId = user?.$id;

        if (!userId) {
            return { managing: [], playing: [], userId: null };
        }

        const managerTeamIds = [];
        const playerTeamIds = [];

        // Try to get teams from Appwrite Teams API first (for new teams)
        try {
            const userTeams = await teams.list();

            // Check each team to determine user's role
            for (const team of userTeams.teams) {
                try {
                    // Query specifically for the current user's membership in this team
                    const memberships = await teams.listMemberships(team.$id, [
                        Query.equal("userId", userId),
                    ]);
                    const userMembership = memberships.memberships[0];

                    if (userMembership) {
                        // Check roles to categorize as manager or player
                        if (
                            userMembership.roles.includes("manager") ||
                            userMembership.roles.includes("owner")
                        ) {
                            managerTeamIds.push(team.$id);
                        } else {
                            playerTeamIds.push(team.$id);
                        }
                    } else {
                        // Fallback: Default to player if we somehow can't verify the role
                        playerTeamIds.push(team.$id);
                    }
                } catch (_error) {
                    // Fallback on error too
                    playerTeamIds.push(team.$id);
                }
            }
        } catch (_teamsApiError) {
            // Error fetching teams from Appwrite Teams API
        }

        // Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            // Fetch each team document individually as querying by $id (rowId)
            // in TablesDB listRows may not return results for all users.
            const teamPromises = teamIds.map((id) =>
                readDocument("teams", id, [], client).catch(() => null),
            );
            const teams = (await Promise.all(teamPromises)).filter(
                (t) => t !== null,
            );

            // 1. Batch fetch seasons for all teams
            const allTeamIds = teams.map((t) => t.$id);
            let allSeasons = [];
            if (allTeamIds.length > 0) {
                const seasonsResponse = await listDocuments(
                    "seasons",
                    [Query.equal("teamId", allTeamIds)],
                    client,
                );
                allSeasons = seasonsResponse.rows || [];

                if (isDashboard) {
                    // Strip unnecessary fields from seasons for dashboard
                    allSeasons = allSeasons.map(
                        ({
                            $id,
                            teamId,
                            location,
                            startDate,
                            endDate,
                            seasonName,
                        }) => ({
                            $id,
                            teamId,
                            location,
                            startDate,
                            endDate,
                            seasonName,
                        }),
                    );
                }
            }

            // 2. Batch fetch games for all seasons
            const allSeasonIds = allSeasons.map((s) => s.$id);
            let allGames = [];
            if (allSeasonIds.length > 0) {
                if (isDashboard) {
                    const now = DateTime.utc().toISO();
                    // Fetch 10 past games and 10 upcoming games
                    const [pastGames, futureGames] = await Promise.all([
                        listDocuments(
                            "games",
                            [
                                Query.equal("seasons", allSeasonIds),
                                Query.lessThan("gameDate", now),
                                Query.orderDesc("gameDate"),
                                Query.limit(10),
                            ],
                            client,
                        ),
                        listDocuments(
                            "games",
                            [
                                Query.equal("seasons", allSeasonIds),
                                Query.greaterThanEqual("gameDate", now),
                                Query.orderAsc("gameDate"),
                                Query.limit(10),
                            ],
                            client,
                        ),
                    ]);

                    // Map and strip unnecessary fields from games
                    const stripGame = ({
                        $id,
                        gameDate,
                        teamId,
                        opponent,
                        score,
                        opponentScore,
                        result,
                        isHomeGame,
                        location,
                        timeZone,
                        seasons,
                        playerChart,
                        eventType,
                    }) => {
                        const hasLineup = !!(
                            playerChart &&
                            playerChart !== "null" &&
                            playerChart !== "[]"
                        );

                        return {
                            $id,
                            gameDate,
                            teamId,
                            opponent,
                            score,
                            opponentScore,
                            result,
                            isHomeGame,
                            location,
                            timeZone,
                            seasons,
                            hasLineup,
                            eventType,
                        };
                    };

                    allGames = [
                        ...(pastGames.rows || []).map(stripGame),
                        ...(futureGames.rows || []).map(stripGame),
                    ];
                } else {
                    const gamesResponse = await listDocuments(
                        "games",
                        [
                            Query.equal("seasons", allSeasonIds),
                            Query.limit(100), // Increase limit to get all games
                        ],
                        client,
                    );
                    allGames = gamesResponse.rows || [];
                }
            }

            // 3. Map games to seasons
            allSeasons.forEach((season) => {
                const seasonGames = allGames.filter(
                    (g) =>
                        g.seasons === season.$id || g.seasonId === season.$id,
                );

                // For dashboard, we want to flatten games and attach them directly to the team later
                // we also need to carry over the season location if the game doesn't have one
                season.games = seasonGames.map((game) => ({
                    ...game,
                    location: game.location || season.location,
                    seasonName: season.seasonName || season.name || "",
                }));
            });

            // 4. Map seasons or flattened games to teams
            return teams.map((team) => {
                const teamSeasons = allSeasons.filter(
                    (s) => s.teamId === team.$id,
                );

                if (isDashboard) {
                    // Flatten games from all seasons for this team
                    const games = teamSeasons.flatMap((s) => s.games || []);

                    // Return optimized team object for dashboard
                    return {
                        $id: team.$id,
                        name: team.name,
                        displayName: team.displayName,
                        primaryColor: team.primaryColor,
                        games,
                        leagueName: team.leagueName,
                    };
                }

                // For non-dashboard views, attach seasons
                return {
                    ...team,
                    seasons: teamSeasons,
                };
            });
        };

        const managerResults = await fetchTeams(managerTeamIds);
        const playerResults = await fetchTeams(playerTeamIds);

        if (isDashboard) {
            // Fetch additional stats for the dashboard header
            const [awardsResult, gameLogsResult] = await Promise.all([
                listDocuments(
                    "awards",
                    [Query.equal("winner_user_id", userId), Query.limit(1)],
                    client,
                ),
                listDocuments(
                    "game_logs",
                    [Query.equal("playerId", userId), Query.limit(1)],
                    client,
                ),
            ]);

            return {
                managing: managerResults,
                playing: playerResults,
                userId,
                stats: {
                    awardsCount: awardsResult.total || 0,
                    gameCount: gameLogsResult.total || 0,
                    teamCount: managerResults.length + playerResults.length,
                },
            };
        }

        return { managing: managerResults, playing: playerResults, userId };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}

export async function getTeamById({ teamId, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    if (teamId) {
        const managerIds = [];
        const ownerIds = [];
        const scorekeeperIds = [];
        const userIds = [];
        const userRoles = {};
        let firstMemberships = null;

        try {
            // Use Admin client to bypass permission checks for listing team members
            const { teams } = createAdminClient();
            const memberships = await teams.listMemberships(teamId);
            firstMemberships = memberships;

            // Extract user IDs and categorize by role
            for (const membership of memberships.memberships) {
                userIds.push(membership.userId);
                userRoles[membership.userId] = membership.roles;

                if (membership.roles.includes("owner")) {
                    ownerIds.push(membership.userId);
                }

                if (
                    membership.roles.includes("manager") ||
                    membership.roles.includes("owner")
                ) {
                    managerIds.push(membership.userId);
                }

                if (
                    membership.roles.includes("scorekeeper") ||
                    membership.roles.includes("manager") ||
                    membership.roles.includes("owner")
                ) {
                    scorekeeperIds.push(membership.userId);
                }
            }
        } catch (teamsApiError) {
            console.error(
                "Error fetching team memberships from Appwrite Teams API:",
                teamsApiError,
            );
        }

        // Get all players from users table
        let players = [];
        if (userIds.length > 0) {
            // Batch query: fetch all users in a single request
            const result = await listDocuments(
                "users",
                [Query.equal("$id", userIds)],
                client,
            );

            const dbPlayersMap = new Map(result.rows.map((p) => [p.$id, p]));

            // Reuse memberships already fetched above to build membershipMap
            const membershipMap = firstMemberships
                ? new Map(
                      firstMemberships.memberships.map((m) => [m.userId, m]),
                  )
                : new Map();

            // Map all IDs to either a DB record or a virtual player
            players = userIds.map((id) => {
                const dbPlayer = dbPlayersMap.get(id);
                const member = membershipMap.get(id);
                const membershipId = member?.$id;

                if (dbPlayer) {
                    return {
                        ...dbPlayer,
                        membershipId,
                        roles: userRoles[id] || [],
                    };
                }

                // Virtual player for unverified/invited users
                return {
                    $id: id,
                    userId: id,
                    membershipId,
                    firstName:
                        member?.userName ||
                        member?.userEmail?.split("@")[0] ||
                        "Invited",
                    lastName: member?.userName ? "" : "Player",
                    email: member?.userEmail || "",
                    roles: userRoles[id] || [],
                    status: "unverified",
                };
            });
        }

        let teamData;
        let isArchiveView = false;
        let participatedSeasonIds = [];

        try {
            teamData = await readDocument("teams", teamId, [], client);
        } catch (err) {
            // Fallback: check if they are a former player who participated in at least one season of this team
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
                        Query.equal("teamId", teamId),
                        Query.equal("playerId", userId),
                        Query.limit(100),
                    ],
                    adminClient,
                );

                if (response.rows && response.rows.length > 0) {
                    const { readDocument: adminReadDocument } = await import(
                        "@/utils/databases"
                    );
                    teamData = await adminReadDocument(
                        "teams",
                        teamId,
                        [],
                        adminClient,
                    );
                    isArchiveView = true;
                    participatedSeasonIds = response.rows.map(
                        (r) => r.seasonId,
                    );
                } else {
                    throw err;
                }
            } catch (fallbackErr) {
                console.error("Access check failed for team:", fallbackErr);
                throw err;
            }
        }

        const activeClient = isArchiveView
            ? await import("@/utils/appwrite/server").then((m) =>
                  m.createAdminClient(),
              )
            : client;

        try {
            const { teams } = await import("@/utils/appwrite/server").then(
                (m) => m.createAdminClient(),
            );
            const prefs = await teams.getPrefs(teamId);
            teamData.prefs = prefs;

            // Enrich players with jersey numbers from team prefs
            if (prefs.jerseyNumbers) {
                players = players.map((player) => ({
                    ...player,
                    jerseyNumber: prefs.jerseyNumbers[player.$id] || null,
                }));
            }
        } catch (_e) {
            teamData.prefs = {};
        }

        // Manually fetch seasons since TablesDB doesn't auto-populate relationships
        const seasonsResponse = await listDocuments(
            "seasons",
            [Query.equal("teamId", teamId)],
            activeClient,
        );
        let seasons = seasonsResponse.rows || [];

        // If archive view, filter seasons to only those they participated in
        if (isArchiveView) {
            seasons = seasons.filter((s) =>
                participatedSeasonIds.includes(s.$id),
            );
        }

        // Batch fetch games for all seasons
        const seasonIds = seasons.map((s) => s.$id);
        let allGames = [];
        if (seasonIds.length > 0) {
            const gamesResponse = await listDocuments(
                "games",
                [
                    Query.equal("seasons", seasonIds),
                    Query.limit(100), // Increase limit to get all games
                ],
                activeClient,
            );
            allGames = gamesResponse.rows || [];
        }

        // Batch fetch logs for all games
        const gameIds = allGames.map((g) => g.$id);
        let allLogs = [];
        if (gameIds.length > 0) {
            // Fetch logs in batches if needed, or increase limit.
            const logsResponse = await listDocuments(
                "game_logs",
                [Query.equal("gameId", gameIds), Query.limit(5000)],
                activeClient,
            );
            allLogs = logsResponse?.rows || [];
        }

        // Map games to seasons
        seasons.forEach((season) => {
            season.games = allGames
                .filter(
                    (g) =>
                        g.seasons === season.$id || g.seasonId === season.$id,
                )
                .map((game) => {
                    game.teamName = teamData.name;
                    game.displayName = teamData.displayName || "";
                    game.seasonName = season.seasonName || season.name || "";
                    return game;
                });
        });

        // Attach seasons to teamData
        teamData.seasons = seasons;

        if (isArchiveView) {
            players = [];
        }

        return {
            teamData,
            players,
            managerIds,
            ownerIds,
            scorekeeperIds,
            teamLogs: allLogs,
            isArchiveView,
        };
    } else {
        return { teamData: {} };
    }
}
