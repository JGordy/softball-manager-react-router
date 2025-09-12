import { Query } from "@/appwrite";
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
        const managerTeamIds = memberships.documents
            .filter((m) => m.role === "manager")
            .map((m) => m.teamId);

        const playerTeamIds = memberships.documents
            .filter((m) => m.role === "player")
            .map((m) => m.teamId);

        // 4. Fetch teams for managers and players
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
