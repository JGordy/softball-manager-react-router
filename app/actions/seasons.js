import { ID } from "node-appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

import { hasBadWords } from "@/utils/badWordsApi";

import { findOrCreatePark } from "@/actions/parks";

import { removeEmptyValues } from "./utils/formUtils";

export async function createSeason({ values, teamId }) {
    const { locationDetails, seasonName, ...rest } = values;

    let parsedLocationDetails = null;
    try {
        parsedLocationDetails = JSON.parse(locationDetails);
    } catch (error) {
        console.error("Error parsing locationDetails:", error);
    }

    try {
        // Check season name for inappropriate language
        if (seasonName && (await hasBadWords(seasonName))) {
            return {
                success: false,
                status: 400,
                message:
                    "Season name contains inappropriate language. Please choose a different name.",
            };
        }
        const seasonId = ID.unique(); // Create this now so it's easier to use later
        let parkId;

        if (parsedLocationDetails?.placeId) {
            const parkResponse = await findOrCreatePark({
                values: parsedLocationDetails,
                placeId: parsedLocationDetails.placeId,
            });

            console.log("actions/seasons.js ", { parkResponse });

            if (parkResponse) {
                parkId = parkResponse.$id;
            }
        }

        const season = await createDocument("seasons", seasonId, {
            ...rest,
            gameDays: rest.gameDays.split(","), // Split into an array of gameDays
            parkId: parkId || null,
            seasonName,
            signUpFee: Number(rest.signUpFee),
            teamId,
            teams: [teamId],
        });

        return {
            response: { season },
            status: 201,
            success: true,
            message: "Season created successfully!",
        };
    } catch (error) {
        console.error("Error creating season:", error);
        throw error;
    }
}

export async function updateSeason({ values, seasonId }) {
    const { locationDetails, seasonName, ...rest } = values;

    let parkId;

    try {
        // Check season name for inappropriate language
        if (seasonName && (await hasBadWords(seasonName))) {
            return {
                success: false,
                status: 400,
                message:
                    "Season name contains inappropriate language. Please choose a different name.",
            };
        }
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
                    placeId: parsedLocationDetails.placeId,
                });

                if (parkResponse?.$id) {
                    parkId = parkResponse.$id;
                }
            }
        }

        // Removes undefined or empty string values from data to update
        let dataToUpdate = removeEmptyValues({ values: rest });

        // Process other fields that need transformation
        if (dataToUpdate.gameDays)
            dataToUpdate.gameDays = dataToUpdate.gameDays.split(",");
        if (dataToUpdate.signUpFee)
            dataToUpdate.signUpFee = Number(dataToUpdate.signUpFee);

        // Conditionally add parkId to the update payload if it was found/created
        if (parkId) dataToUpdate.parkId = parkId;

        const seasonDetails = await updateDocument(
            "seasons",
            seasonId,
            dataToUpdate,
        );

        return {
            response: { seasonDetails },
            status: 204,
            success: true,
            message: "Season updated successfully!",
        };
    } catch (error) {
        console.error("Error updating season:", error);
        // Re-throw the error to be handled by the caller (e.g., React Router action)
        throw error;
    }
}
