import { readDocument } from '@/utils/databases';

export async function getSeasonDetails({ seasonId }) {
    if (seasonId) {
        // TODO: Add team name to games
        return { season: await readDocument('seasons', seasonId) };
    } else {
        return { season: {} };
    }
};