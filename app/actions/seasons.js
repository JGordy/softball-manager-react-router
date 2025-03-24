import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

import { removeEmptyValues } from './utils/formUtils';

export async function createSeason({ values, teamId }) {
    const { locationDetails, ...rest } = values;
    console.log({ locationDetails });

    try {
        const seasonId = ID.unique(); // Create this now so it's easier to use later

        const season = await createDocument(
            'seasons', // Your users collection ID
            seasonId, // Generates a unique user ID in the handler
            {
                ...rest,
                gameDays: rest.gameDays.split(","), // Split into an array of positions
                signUpFee: Number(rest.signUpFee),
                teamId,
                teams: [teamId],
            },
        );

        return { response: { season }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating season:", error);
        throw error;
    }
}

export async function updateSeason({ values, seasonId }) {
    const { locationDetails, ...rest } = values;
    console.log({ locationDetails });
    // Removes undefined or empty string values from data to update
    let dataToUpdate = removeEmptyValues({ values: rest });

    if (dataToUpdate.gameDays) dataToUpdate.gameDays = dataToUpdate.gameDays.split(",");
    if (dataToUpdate.signUpFee) dataToUpdate.signUpFee = Number(dataToUpdate.signUpFee);

    try {
        const seasonDetails = await updateDocument('seasons', seasonId, dataToUpdate);

        return { response: { seasonDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating season:", error);
        throw error;
    }
}