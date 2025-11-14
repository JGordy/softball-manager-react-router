import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import { createSessionClient } from "@/utils/appwrite/server";

export async function getUserTeams({ request }) {
    try {
        // Get authenticated user from session
        const { account } = await createSessionClient(request);
        const user = await account.get();
        const userId = user?.$id;

        if (!userId) {
            return { managing: [], playing: [], userId: null };
        }

        // 1. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments("memberships", [
            Query.equal("userId", userId),
            Query.equal("role", ["manager", "player"]),
        ]);

        // 2. Separate teamIds by role
        const { managerTeamIds, playerTeamIds } = memberships.documents.reduce(
            (acc, m) => {
                if (m.role === "manager") {
                    acc.managerTeamIds.push(m.teamId);
                } else if (m.role === "player") {
                    acc.playerTeamIds.push(m.teamId);
                }
                return acc;
            },
            { managerTeamIds: [], playerTeamIds: [] },
        );

        // 3. Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            // Batch query: fetch all teams in a single request
            const result = await listDocuments("teams", [
                Query.equal("$id", teamIds),
            ]);
            return result.documents;
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
            // Batch query: fetch all users in a single request
            const result = await listDocuments("users", [
                Query.equal("$id", userIds),
            ]);
            players = result.documents;
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
