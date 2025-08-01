import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

const getAttendance = async ({ eventId, accepted = false }) => {
    const { documents: attendance } = await listDocuments('attendance', [
        Query.equal('gameId', eventId),
        ...[accepted && Query.equal('status', 'accepted')],
    ]);
    return attendance;
};

export async function getEventById({ request, eventId }) {
    const { seasons: season, playerChart, ...game } = await readDocument('games', eventId);
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
        game: { ...game, playerChart: JSON.parse(playerChart) },
        managerId,
        season,
        teams,
    };
}

export async function getEventWithPlayerCharts({ request, eventId }) {
    const { seasons: season, playerChart, ...game } = await readDocument('games', eventId);
    const { teams = [] } = season;

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
    const players = await Promise.all(playerPromises).then(users => users.flat());

    const attendance = await getAttendance({ eventId, accepted: true });

    return {
        attendance,
        game,
        managerId,
        teams,
        playerChart: playerChart ? JSON.parse(playerChart) : null,
        players,
    };
}