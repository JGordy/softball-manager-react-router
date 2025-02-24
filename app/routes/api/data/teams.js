import { Query } from '@/appwrite';
import { listDocuments } from '@/utils/databases';

export async function action({ request, params }) {
    const { userId } = await request.json();

    if (!userId) {
        return { managing: [], playing: [] }; // Return empty arrays for both roles
    }

    try {
        // 1. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments('memberships', [
            Query.equal('userId', userId),
            Query.equal('role', ['manager', 'player']),
        ]);

        // 2. Separate teamIds by role
        const managerTeamIds = memberships.documents
            .filter(m => m.role === 'manager')
            .map(m => m.teamId);

        const playerTeamIds = memberships.documents
            .filter(m => m.role === 'player')
            .map(m => m.teamId);

        // 3. Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            const promises = teamIds.map(async (teamId) => {
                const result = await listDocuments('teams', [
                    Query.equal('$id', teamId),
                ]);
                return result.documents;
            });

            const results = await Promise.all(promises);
            return results.flat();
        };

        const managerTeams = await fetchTeams(managerTeamIds);
        const playerTeams = await fetchTeams(playerTeamIds);

        return { managing: managerTeams, playing: playerTeams };

    } catch (error) {
        console.error('Error getting teams: ', error);
        throw error;
    }
}