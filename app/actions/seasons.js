import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

import { findOrCreatePark } from '@/actions/parks';

import { removeEmptyValues } from './utils/formUtils';

export async function createSeason({ values, teamId }) {
    const { locationDetails, ...rest } = values;

    let parsedLocationDetails = null;
    try {
        parsedLocationDetails = JSON.parse(locationDetails);
    } catch (error) {
        console.error("Error parsing locationDetails:", error);
    }

    try {
        const seasonId = ID.unique(); // Create this now so it's easier to use later
        let parkId;

        if (parsedLocationDetails?.placeId) {
            const parkResponse = await findOrCreatePark({
                values: parsedLocationDetails,
                placeId: parsedLocationDetails.placeId
            });

            console.log('actions/seasons.js ', { parkResponse });

            if (parkResponse) {
                parkId = parkResponse.$id;
            }
        }

        const season = await createDocument(
            'seasons',
            seasonId,
            {
                ...rest,
                gameDays: rest.gameDays.split(","), // Split into an array of gameDays
                parkId: parkId || null,
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

    let parkId;

    try {
        if (locationDetails) {
            let parsedLocationDetails;
            try {
                parsedLocationDetails = JSON.parse(locationDetails);
            } catch (parseError) {
                // TODO: Decide how to handle invalid JSON - maybe throw an error or proceed without park update
                // For now, let's log and continue, assuming other fields might still be valid
                console.error("Error parsing locationDetails:", parseError);
            }

            if (parsedLocationDetails?.placeId) {
                const parkResponse = await findOrCreatePark({
                    values: parsedLocationDetails,
                    placeId: parsedLocationDetails.placeId
                });

                if (parkResponse?.$id) {
                    parkId = parkResponse.$id;
                }
            }
        }

        // Removes undefined or empty string values from data to update
        let dataToUpdate = removeEmptyValues({ values: rest });

        // Process other fields that need transformation
        if (dataToUpdate.gameDays) dataToUpdate.gameDays = dataToUpdate.gameDays.split(",");
        if (dataToUpdate.signUpFee) dataToUpdate.signUpFee = Number(dataToUpdate.signUpFee);

        // Conditionally add parkId to the update payload if it was found/created
        if (parkId) dataToUpdate.parkId = parkId;

        const seasonDetails = await updateDocument('seasons', seasonId, dataToUpdate);

        return { response: { seasonDetails }, status: 204, success: true };

    } catch (error) {
        console.error("Error updating season:", error);
        // Re-throw the error to be handled by the caller (e.g., React Router action)
        throw error;
    }
}