import { ID } from "node-appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

import { getParkByPlaceId } from "@/loaders/parks";

import { removeEmptyValues } from "./utils/formUtils";

export async function findOrCreatePark({ values, placeId }) {
    let existingPark;

    if (placeId) {
        existingPark = await getParkByPlaceId({ placeId });
    }

    if (existingPark) {
        return existingPark;
    }

    const { location, ...rest } = values;

    const newPark = await createDocument("parks", ID.unique(), {
        ...rest,
        latitude: location?.lat,
        longitude: location?.lng,
    });

    return newPark;
}

export async function updatePark({ values, parkId }) {
    if (parkId && values) {
        const parsedLocationDetails = JSON.parse(values);
        // Removes undefined or empty string values from data to update
        let dataToUpdate = removeEmptyValues({ values: parsedLocationDetails });

        try {
            const parkDetails = await updateDocument(
                "parks",
                parkId,
                dataToUpdate,
            );

            return { response: { parkDetails }, status: 204, success: true };
        } catch (error) {
            console.error("Error updating park:", error);
            throw error;
        }
    }
}
