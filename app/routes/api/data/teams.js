import { Query } from "node-appwrite";
import { listDocuments } from "@/utils/databases";

export async function action({ request, params }) {
    const { userId } = await request.json();

    if (!userId) {
        return { managing: [], playing: [] }; // Return empty arrays for both roles
    }

    try {
        // 1. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments("memberships", [
            Query.equal("userId", userId),
            Query.equal("role", ["manager", "player"]),
        ]);

        // 2. Separate teamIds by role
        const managerTeamIds = memberships.rows
            .filter((m) => m.role === "manager")
            .map((m) => m.teamId);

        const playerTeamIds = memberships.rows
            .filter((m) => m.role === "player")
            .map((m) => m.teamId);

        // 3. Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            // Batch fetch all teams in a single query
            const result = await listDocuments("teams", [
                Query.equal("$id", teamIds),
            ]);
            const teams = result.rows || [];

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
                    Query.equal("seasonId", allSeasonIds),
                ]);
                allGames = gamesResponse.rows || [];
            }

            // 3. Map games to seasons
            allSeasons.forEach((season) => {
                season.games = allGames.filter(
                    (g) => g.seasonId === season.$id,
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

        return { managing: managerTeams, playing: playerTeams };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}
