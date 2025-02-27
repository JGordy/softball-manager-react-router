import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

import getGames from '@/utils/getGames';

export async function action({ request, params }) {
    const { userId } = await request.json();

    if (!userId) {
        return { user: {}, teams: [], games: [] };
    }

    try {
        // 1. Get user profile data
        const user = await readDocument('users', userId);

        // 2. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments('memberships', [
            Query.equal('userId', userId),
            Query.equal('role', ['manager', 'player']),
        ]);

        // 4. Fetch teams for managers and players
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

        const teams = await fetchTeams(memberships);

        const games = getGames({ teams });

        return { user, games };

    } catch (error) {
        console.error('Error getting teams: ', error);
        throw error;
    }
}