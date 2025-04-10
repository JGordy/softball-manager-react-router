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
    if (locationDetails) {
        const parsedLocationDetails = JSON.parse(locationDetails);
        if (parsedLocationDetails?.placeId) {
            const parkResponse = await findOrCreatePark({
                values: parsedLocationDetails,
                placeId: parsedLocationDetails.placeId
            });
            console.log({ parkResponse });
        }
    }
    // // Removes undefined or empty string values from data to update
    // let dataToUpdate = removeEmptyValues({ values: rest });

    // if (dataToUpdate.gameDays) dataToUpdate.gameDays = dataToUpdate.gameDays.split(",");
    // if (dataToUpdate.signUpFee) dataToUpdate.signUpFee = Number(dataToUpdate.signUpFee);
    // if (parkId) dataToUpdate.parkId = parkId;

    // try {
    //     const seasonDetails = await updateDocument('seasons', seasonId, dataToUpdate);

    //     return { response: { seasonDetails }, status: 204, success: true };
    // } catch (error) {
    //     console.error("Error updating season:", error);
    //     throw error;
    // }
}