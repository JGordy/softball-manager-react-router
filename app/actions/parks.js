import { ID, Permission, Role } from "node-appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

import { getParkByPlaceId } from "@/loaders/parks";

import { removeEmptyValues } from "./utils/formUtils";

export async function findOrCreatePark({ values, placeId, client }) {
    let existingPark;

    if (placeId) {
        existingPark = await getParkByPlaceId({ placeId, client });
    }

    if (existingPark) {
        return existingPark;
    }

    const { location, ...rest } = values;

    // Parks are public reference data - anyone can read, authenticated users can modify
    const permissions = [
        Permission.read(Role.any()), // Anyone can read park info
        Permission.update(Role.users()), // Authenticated users can update
        Permission.delete(Role.users()), // Authenticated users can delete
    ];

    const newPark = await createDocument(
        "parks",
        ID.unique(),
        {
            ...rest,
            latitude: location?.lat,
            longitude: location?.lng,
        },
        permissions,
        client,
    );

    return newPark;
}

export async function updatePark({ values, parkId, client }) {
    if (parkId && values) {
        const parsedLocationDetails = JSON.parse(values);
        // Removes undefined or empty string values from data to update
        let dataToUpdate = removeEmptyValues({ values: parsedLocationDetails });

        try {
            if (!client) {
                throw new Error(
                    "A constructed 'client' object is strictly required for authorization.",
                );
            }

            const parkDetails = await updateDocument(
                "parks",
                parkId,
                dataToUpdate,
                client,
            );

            return { response: { parkDetails }, status: 204, success: true };
        } catch (error) {
            console.error("Error updating park:", error);
            throw error;
        }
    }
}
