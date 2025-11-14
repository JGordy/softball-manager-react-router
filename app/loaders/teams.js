import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import { createSessionClient } from "@/utils/appwrite/server";

export async function getUserTeams({ request }) {
    try {
        // Get authenticated user from session
        const { account } = await createSessionClient(request);
        const user = await account.get();
        const userId = user.$id;

        if (!userId) {
            return { managing: [], playing: [] };
        }

        // 1. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments("memberships", [
            Query.equal("userId", userId),
            Query.equal("role", ["manager", "player"]),
        ]);

        // 2. Separate teamIds by role
        const managerTeamIds = memberships.documents
            .filter((m) => m.role === "manager")
            .map((m) => m.teamId);

        const playerTeamIds = memberships.documents
            .filter((m) => m.role === "player")
            .map((m) => m.teamId);

        // 3. Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            const promises = teamIds.map(async (teamId) => {
                const result = await listDocuments("teams", [
                    Query.equal("$id", teamId),
                ]);
                return result.documents;
            });

            const results = await Promise.all(promises);
            return results.flat();
        };

        const managerTeams = await fetchTeams(managerTeamIds);
        const playerTeams = await fetchTeams(playerTeamIds);

        return { managing: managerTeams, playing: playerTeams, userId };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}

export async function getTeamById({ teamId }) {
    if (teamId) {
        // 1. Get memberships
        const memberships = await listDocuments("memberships", [
            Query.equal("teamId", teamId),
        ]);

        // 2. Get the manager's id
        const managerIds = memberships.documents
            .filter((document) => document.role === "manager")
            .map((document) => document.userId);

        // 3. Extract userIds
        const userIds = memberships.documents.map((m) => m.userId);

        // 4. Get all players
        let players = [];
        if (userIds.length > 0) {
            // Make multiple queries
            const promises = userIds.map(async (userId) => {
                const result = await listDocuments("users", [
                    Query.equal("$id", userId),
                ]);
                return result.documents;
            });

            const results = await Promise.all(promises);
            players = results.flat();
        }

        const teamData = await readDocument("teams", teamId);

        const formatGames = (season) =>
            season?.games?.map((game) => {
                game.teamName = teamData.name;
                return game;
            });

        teamData?.seasons?.map((season) => formatGames(season));

        return { teamData, players, managerIds };
    } else {
        return { teamData: {} };
    }
}
