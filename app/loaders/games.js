import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

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

    const park = parkId ? await readDocument('parks', parkId) : null;

    const { documents: userIds } = await await listDocuments('memberships', [
        Query.equal('teamId', [teams[0].$id]),
    ]);

    const { userId: managerId } = userIds.find(userId => userId.role === 'manager');

    const promises = userIds.map(async ({ userId }) => {
        const result = await listDocuments('users', [
            Query.equal('$id', userId),
        ]);
        return result.documents;
    });

    const users = await Promise.all(promises);

    // Defer loading availability details by not awaiting the promise
    const availabilityPromise = getAvailabilityDetails({ request, eventId });

    return {
        game,
        managerId,
        park,
        season,
        teams,
        players: users.flat(),
        availability: availabilityPromise,
    };
}