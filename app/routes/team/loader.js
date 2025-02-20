import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

export async function getTeamData({ teamId }) {

    if (teamId) {
        // 1. Get memberships
        const memberships = await listDocuments('memberships', [
            Query.equal('teamId', teamId),
        ]);

        // 2. Get the manager's id
        const { userId: managerId } = memberships.documents.find(document => document.role === 'manager');

        // 3. Extract teamIds
        const userIds = memberships.documents.map(m => m.userId);

        // 4. Get all players
        let players = [];
        if (userIds.length > 0) {
            // Make multiple queries
            const promises = userIds.map(async (userId) => {
                const result = await listDocuments('users', [
                    Query.equal('$id', userId),
                ]);
                return result.documents;
            });

            const results = await Promise.all(promises);
            players = results.flat();
        }

        return {
            teamData: await readDocument('teams', teamId),
            players,
            managerId,
        };
    } else {
        return { teamData: {} };
    }
};