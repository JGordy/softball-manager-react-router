import { updateDocument } from '@/utils/databases.js';

// Creates a google form for each upcoming game to gather attendance for later lineup generation
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
        return { formResponse, status: 201, success: true };
    } catch (error) {

        console.error("Error creating attendance:", error);
        return { success: false, error: error.message };
    }
}

// Save a created lineup and field chart to appwrite database
export async function savePlayerChart({ values, eventId }) {
    console.log('savePlayerChart: ', { values });
    const { playerChart } = values;
    // NOTE: We must stringify the playerChart json before sending to appwrite
    try {
        const gameDetails = await updateDocument('games', eventId, {
            playerChart: JSON.stringify(playerChart),
        });

        return { response: { gameDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating lineup and fielding chart:", error);
        throw error;
    }
}

// Calls the gemini generative ai to generate a lineup and field chart
export async function generatePlayerChart({ values }) {
    console.log('generatePlayerChart: ', { values });
    // TODO: Generate a batting lineup and fielding chart using gen AI
}