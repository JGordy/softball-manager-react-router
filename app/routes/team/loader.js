import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

export async function getTeamData({ teamId }) {

    if (teamId) {
        const memberships = await listDocuments('memberships', [
            Query.equal('teamId', teamId),
        ]);

        // 2. Extract teamIds
        const userIds = memberships.documents.map(m => m.userId);

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
        };
    } else {
        return { teamData: {} };
    }
};