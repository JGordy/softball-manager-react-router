import { readDocument } from '@/utils/databases';

export async function getSeasonById({ seasonId }) {
    if (seasonId) {
        // TODO: Add team name to games
        return { season: await readDocument('seasons', seasonId) };
    } else {
        return { season: {} };
    }
};