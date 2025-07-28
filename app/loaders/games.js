import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

export async function getEventById({ request, eventId }) {
    const { seasons: season, ...game } = await readDocument('games', eventId);
    const { teams = [], parkId } = season;

    const { documents: userIds } = await listDocuments('memberships', [
        Query.equal('teamId', [teams[0].$id]),
    ]);

    const { userId: managerId } = userIds.find(userId => userId.role === 'manager');

    // --- Start of deferred data ---
    const playerPromises = userIds.map(async ({ userId }) => {
        const result = await listDocuments('users', [
            Query.equal('$id', userId),
        ]);
        return result.documents;
    });
    const playersPromise = Promise.all(playerPromises).then(users => users.flat());

    const parkPromise = parkId ? readDocument('parks', parkId) : Promise.resolve(null);
    const attendancePromise = listDocuments('attendance', [Query.equal('gameId', eventId)]);

    const deferredData = Promise.all([
        playersPromise,
        parkPromise,
        attendancePromise,
    ]).then(([players, park, attendance]) => ({
        players,
        park,
        attendance,
    }));

    return {
        deferredData,
        game,
        managerId,
        season,
        teams,
    };
}