import { ID } from '@/appwrite';
import { createDocument, readDocument, updateDocument } from '@/utils/databases.js';

import { getParkByPlaceId } from '@/loaders/parks';

export async function findOrCreatePark({ values, placeId }) {
    let existingPark;

    if (placeId) {
        existingPark = await getParkByPlaceId({ placeId });
    }

    if (existingPark) {
        return existingPark;
    }

    const { location, ...rest } = values;

    const newPark = await createDocument('parks', ID.unique(), {
        ...rest,
        latitude: location?.lat,
        longitude: location?.lng,
    });

    return newPark;
};

export async function updatePark({ values, parkId }) {

};

