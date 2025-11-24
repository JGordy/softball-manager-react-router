import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

export async function action({ request, params }) {
    const { userId, teamRoles = [] } = await request.json();

    if (!userId) {
        return { user: {}, managing: [], playing: [] }; // Return empty arrays for both roles
    }

    try {
        // 1. Get user profile data
        const user = await readDocument("users", userId);

        const teams = {};

        // 2. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments("memberships", [
            Query.equal("userId", userId),
            Query.equal("role", teamRoles),
        ]);

        // 3. Separate teamIds by role
        const managerTeamIds = memberships.rows
            .filter((m) => m.role === "manager")
            .map((m) => m.teamId);

        const playerTeamIds = memberships.rows
            .filter((m) => m.role === "player")
            .map((m) => m.teamId);

        // 4. Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            // Batch fetch all teams in a single query
            const result = await listDocuments("teams", [
                Query.equal("$id", teamIds),
            ]);
            const teams = result.rows || [];

            // For each team, manually fetch seasons and games (TablesDB doesn't auto-populate relationships)
            for (const team of teams) {
                const seasonsResponse = await listDocuments("seasons", [
                    Query.equal("teamId", team.$id),
                ]);
                const seasons = seasonsResponse.rows || [];

                // For each season, fetch games
                for (const season of seasons) {
                    const gamesResponse = await listDocuments("games", [
                        Query.equal("seasons", season.$id),
                    ]);
                    season.games = gamesResponse.rows || [];
                }

                team.seasons = seasons;
            }

            return teams;
        };

        if (teamRoles.includes("manager")) {
            teams.managing = await fetchTeams(managerTeamIds);
        }
        if (teamRoles.includes("player")) {
            teams.playing = await fetchTeams(playerTeamIds);
        }

        return { user, ...teams };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}
