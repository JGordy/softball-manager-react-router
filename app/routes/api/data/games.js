import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

import getGames from "@/utils/getGames";

export async function action({ request, params }) {
    const { userId } = await request.json();

    if (!userId) {
        return { user: {}, teams: [], games: [] };
    }

    try {
        // 1. Get user profile data
        const user = await readDocument("users", userId);

        // 2. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments("memberships", [
            Query.equal("userId", userId),
            Query.equal("role", ["manager", "player"]),
        ]);

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
                        Query.equal("seasonId", season.$id),
                    ]);
                    season.games = gamesResponse.rows || [];
                }

                team.seasons = seasons;
            }

            return teams;
        };

        const teams = await fetchTeams(memberships);

        const games = getGames({ teams });

        return { user, games };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}
