import { readDocument } from '@/utils/databases';

export async function getSeasonDetails({ seasonId }) {

    if (seasonId) {
        return {
            season: await readDocument('seasons', seasonId),
        };
    } else {
        return { season: {} };
    }
};