import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

export async function getTeams({ userId }) {
    // 1. Check relationships table to list memberships for the userId, manager
    const memberships = await listDocuments('memberships', [
        Query.equal('userId', userId),
        Query.equal('role', 'manager'),
    ]);

    // 2. Extract teamIds
    const teamIds = memberships.documents.map(m => m.teamId);

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
}

export async function getProfile({ userId }) {
    return await readDocument('users', userId);
}