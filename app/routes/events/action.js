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

export async function createAttendanceForm({ values, request }) {
    const { team, gameDate, opponent, gameId } = values;

    try {

        const url = new URL(request.url);
        const baseUrl = url.origin;

        const response = await fetch(`${baseUrl}/api/create-attendance`, {
            method: 'POST',
            body: JSON.stringify({ team: JSON.parse(team), gameDate, opponent, gameId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }

        const formResponse = await response.json();

        // Return a success message or the form response
        return { success: true, formResponse };

    } catch (error) {
        console.error("Error creating attendance:", error);
        return { success: false, error: error.message };
    }
}

export async function savePlayerChart({ values }) {
    console.log('savePlayerChart: ', { values });
    // TODO: Save created lineup to appwrite database
}

export async function generatePlayerChart({ values }) {
    console.log('generatePlayerChart: ', { values });
    // TODO: Generate a batting lineup and fielding chart using gen AI
}