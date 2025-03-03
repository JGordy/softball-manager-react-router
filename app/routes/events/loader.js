import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

export async function getEventDetails({ eventId }) {
    const { seasons: season, ...game } = await readDocument('games', eventId);
    const { teams = [] } = season;
    const { documents: userIds } = await await listDocuments('memberships', [
        Query.equal('teamId', [teams[0].$id]),
    ]);

    const promises = userIds.map(async ({ userId }) => {
        const result = await listDocuments('users', [
            Query.equal('$id', userId),
        ]);
        return result.documents;
    });

    const users = await Promise.all(promises);

    return { game, season, teams, players: users.flat() };
}