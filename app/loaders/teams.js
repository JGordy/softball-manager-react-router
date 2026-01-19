import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";

export async function getUserTeams({ request }) {
    try {
        // Get authenticated user from session
        const { account, teams } = await createSessionClient(request);
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
                    const memberships = await teams.listMemberships(team.$id);
                    const userMembership = memberships.memberships.find(
                        (m) => m.userId === userId,
                    );

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
                    }
                } catch (error) {
                    console.error(
                        `Error checking membership for team ${team.$id}:`,
                        error,
                    );
                }
            }
        } catch (teamsApiError) {
            console.error(
                "Error fetching teams from Appwrite Teams API:",
                teamsApiError,
            );
        }

        // Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            // Batch query: fetch all teams in a single request
            const result = await listDocuments("teams", [
                Query.equal("$id", teamIds),
            ]);
            const teams = result.rows;

            // 1. Batch fetch seasons for all teams
            const allTeamIds = teams.map((t) => t.$id);
            let allSeasons = [];
            if (allTeamIds.length > 0) {
                const seasonsResponse = await listDocuments("seasons", [
                    Query.equal("teamId", allTeamIds),
                ]);
                allSeasons = seasonsResponse.rows || [];
            }

            // 2. Batch fetch games for all seasons
            const allSeasonIds = allSeasons.map((s) => s.$id);
            let allGames = [];
            if (allSeasonIds.length > 0) {
                const gamesResponse = await listDocuments("games", [
                    Query.equal("seasons", allSeasonIds),
                    Query.limit(100), // Increase limit to get all games
                ]);
                allGames = gamesResponse.rows || [];
            }

            // 3. Map games to seasons
            allSeasons.forEach((season) => {
                season.games = allGames.filter(
                    (g) =>
                        g.seasons === season.$id || g.seasonId === season.$id,
                );
            });

            // 4. Map seasons to teams
            teams.forEach((team) => {
                team.seasons = allSeasons.filter((s) => s.teamId === team.$id);
            });

            return teams;
        };

        const managerTeams = await fetchTeams(managerTeamIds);
        const playerTeams = await fetchTeams(playerTeamIds);

        return { managing: managerTeams, playing: playerTeams, userId };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}

export async function getTeamById({ teamId, request }) {
    if (teamId) {
        const managerIds = [];
        const ownerIds = [];
        const scorekeeperIds = [];
        const userIds = [];
        const userRoles = {};

        // Try to get memberships from Appwrite Teams API first (for new teams)
        try {
            // Use Admin client to bypass permission checks for listing team members
            const { teams } = createAdminClient();
            const memberships = await teams.listMemberships(teamId);

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
            const result = await listDocuments("users", [
                Query.equal("$id", userIds),
            ]);
            players = result.rows.map((player) => ({
                ...player,
                roles: userRoles[player.$id] || [],
            }));
        }

        const teamData = await readDocument("teams", teamId);

        // Manually fetch seasons since TablesDB doesn't auto-populate relationships
        const seasonsResponse = await listDocuments("seasons", [
            Query.equal("teamId", teamId),
        ]);
        const seasons = seasonsResponse.rows || [];

        // Batch fetch games for all seasons
        const seasonIds = seasons.map((s) => s.$id);
        let allGames = [];
        if (seasonIds.length > 0) {
            const gamesResponse = await listDocuments("games", [
                Query.equal("seasons", seasonIds),
                Query.limit(100), // Increase limit to get all games
            ]);
            allGames = gamesResponse.rows || [];
        }

        // Batch fetch logs for all games
        const gameIds = allGames.map((g) => g.$id);
        let allLogs = [];
        if (gameIds.length > 0) {
            // Fetch logs in batches if needed, or increase limit.
            // For now, assuming < 5000 logs for a team view or using a reasonable limit.
            // Appwrite limit is typically 5000 with offset, or 100 default.
            // We use a safe high number.
            const logsResponse = await listDocuments("game_logs", [
                Query.equal("gameId", gameIds),
                Query.limit(5000),
            ]);
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
                    return game;
                });
        });

        // Attach seasons to teamData
        teamData.seasons = seasons;

        return {
            teamData,
            players,
            managerIds,
            ownerIds,
            scorekeeperIds,
            teamLogs: allLogs,
        };
    } else {
        return { teamData: {} };
    }
}
