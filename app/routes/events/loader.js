import { readDocument } from '@/utils/databases';

export async function getEventDetails({ eventId }) {
    return await readDocument('games', eventId);
}