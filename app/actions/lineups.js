import { updateDocument } from "@/utils/databases.js";

// Save a created lineup and field chart to appwrite database
export async function savePlayerChart({ values, eventId }) {
    const { playerChart } = values;
    // NOTE: We must stringify the playerChart json before sending to appwrite
    try {
        const gameDetails = await updateDocument("games", eventId, {
            playerChart: JSON.stringify(playerChart),
        });

        return { response: { gameDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating lineup and fielding chart:", error);
        throw error;
    }
}

export async function saveBattingOrder({ values, teamId }) {
    const { idealLineup } = values;
    try {
        const teamDetails = await updateDocument("teams", teamId, {
            idealLineup:
                typeof idealLineup === "string"
                    ? idealLineup
                    : JSON.stringify(idealLineup),
        });

        return { response: { teamDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating team batting order:", error);
        throw error;
    }
}

export async function saveFieldingPositions({ values, teamId }) {
    const { idealPositioning } = values;
    try {
        const teamDetails = await updateDocument("teams", teamId, {
            idealPositioning:
                typeof idealPositioning === "string"
                    ? idealPositioning
                    : JSON.stringify(idealPositioning),
        });

        return { response: { teamDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating team fielding positions:", error);
        throw error;
    }
}

// Calls the gemini generative ai to generate a lineup and field chart
export async function generatePlayerChart({ values }) {
    console.log("generatePlayerChart: ", { values });
    // TODO: Generate a batting lineup and fielding chart using gen AI
}
