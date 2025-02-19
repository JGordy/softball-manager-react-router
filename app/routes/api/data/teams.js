import { Query } from '@/appwrite';
import { listDocuments } from '@/utils/databases';

export async function action({ request, params }) {

    const { userId } = await request.json();

    if (!userId) {
        return [];
    }

    try {
        // 1. Check relationships table to list memberships for the userId, coach
        // TODO: Get all teams the user either coaches (current function) or players for (role: player)
        const memberships = await listDocuments('memberships', [
            Query.equal('userId', userId),
            Query.equal('role', 'coach'),
        ]);

        // 2. Extract teamIds
        const teamIds = memberships.documents.map(m => m.teamId);

        if (teamIds.length === 0) {
            return []; // No teams found, return empty array
        }

        // 3. Call the Appwrite function
        let teams = [];
        if (teamIds.length > 0) {
            // Make multiple queries
            const promises = teamIds.map(async (teamId) => {
                const result = await listDocuments('teams', [
                    Query.equal('$id', teamId),
                ]);
                return result.documents; // Extract the documents
            });

            const results = await Promise.all(promises); // Wait for all queries to complete
            teams = results.flat(); // Flatten the array of arrays into a single array
        }

        return teams;

    } catch (error) {
        console.error('Error getting teams: ', error);
        throw error;
    }
}