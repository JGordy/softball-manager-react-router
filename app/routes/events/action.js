import { updateDocument } from '@/utils/databases';
import { combineDateTime } from '@/utils/dateTime';

export async function updateGame({ values, eventId }) {
    // Removes undefined or empty string values from data to update
    let dataToUpdate = {};
    for (const key in values) {
        if (values.hasOwnProperty(key) && values[key] !== undefined && values[key] !== "") {
            dataToUpdate[key] = values[key];
        }
    }

    if (values.gameDate && values.gameTime) {
        dataToUpdate.gameDate = combineDateTime(values.gameDate, values.gameTime);
    }

    if (values.isHomeGame) {
        dataToUpdate.isHomeGame = values.isHomeGame === 'true';
    }

    delete dataToUpdate.gameTime;

    try {
        const gameDetails = await updateDocument('games', eventId, dataToUpdate);

        return { response: { gameDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating game:", error);
        throw error;
    }
}