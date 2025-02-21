import { updateDocument } from '@/utils/databases';

export async function addGames({ values, teamId }) {
    // Removes undefined or empty string values from data to update
    // const dataToUpdate = {};
    // for (const key in values) {
    //     if (values.hasOwnProperty(key) && values[key] !== undefined && values[key] !== "") {
    //         dataToUpdate[key] = values[key];
    //     }
    // }

    // try {
    //     const teamDetails = await updateDocument('teams', teamId, dataToUpdate);

    //     return { response: { teamDetails }, status: 204, success: true }
    // } catch (error) {
    //     console.error("Error updating team:", error);
    //     throw error;
    // }
}

export async function updateSeason({ values, seasonId }) {
    // Removes undefined or empty string values from data to update
    const dataToUpdate = {};
    for (const key in values) {
        if (values.hasOwnProperty(key) && values[key] !== undefined && values[key] !== "") {
            dataToUpdate[key] = values[key];
        }
    }

    try {
        const seasonDetails = await updateDocument('seasons', seasonId, dataToUpdate);

        return { response: { seasonDetails }, status: 204, success: true }
    } catch (error) {
        console.error("Error updating season:", error);
        throw error;
    }
}