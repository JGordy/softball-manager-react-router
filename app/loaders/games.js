import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

// TODO: Remove this function once the Google Forms integration is no longer used
const getAvailabilityDetails = async ({ request, eventId }) => {
    const availabilityForm = await listDocuments('forms', [
        Query.equal('gameId', eventId),
    ]);

    if (availabilityForm.documents.length === 0) {
        return { form: null, responses: null };
    }

    const form = availabilityForm.documents[0];

    const origin = new URL(request.url).origin; // Get origin from request

    const response = await fetch(`${origin}/api/get-availability`, {
        method: "POST",
        body: JSON.stringify(form),
    });

    return {
        form,
        ...({ ...await response.json() }),
    }
};

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
    const attendancePromise = listDocuments('attendance', [Query.equal('$id', eventId)]);
    const availabilityPromise = getAvailabilityDetails({ request, eventId });

    const deferredData = Promise.all([
        playersPromise,
        parkPromise,
        attendancePromise,
        availabilityPromise,
    ]).then(([players, park, attendance, availability]) => ({
        players,
        park,
        attendance,
        availability,
    }));

    return {
        deferredData,
        game,
        managerId,
        season,
        teams,
    };
}