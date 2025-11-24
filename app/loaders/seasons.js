import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

export async function getSeasonById({ seasonId }) {
    if (seasonId) {
        const season = await readDocument("seasons", seasonId);

        // Manually fetch teams since TablesDB doesn't auto-populate relationships
        if (season.teams && season.teams.length > 0) {
            const teamsResponse = await listDocuments("teams", [
                Query.equal("$id", season.teams),
            ]);
            season.teams = teamsResponse.rows || [];
        } else if (season.teamId) {
            // Fallback: if teams array doesn't exist but teamId does, use that
            const teamsResponse = await listDocuments("teams", [
                Query.equal("$id", [season.teamId]),
            ]);
            season.teams = teamsResponse.rows || [];
        } else {
            season.teams = [];
        }

        // Manually fetch games for this season
        const gamesResponse = await listDocuments("games", [
            Query.equal("seasonId", seasonId),
        ]);
        season.games = gamesResponse.rows || [];

        return { season };
    } else {
        return { season: {} };
    }
}
