import { updateDocument } from "@/utils/databases.js";
import { getNotifiableTeamMembers } from "@/utils/teams.js";
import { sendLineupFinalizedNotification } from "@/actions/notifications.js";

// Save a created lineup and field chart to appwrite database
export async function savePlayerChart({
    values,
    eventId,
    sendNotification = false,
}) {
    const { playerChart } = values;
    // NOTE: We must stringify the playerChart json before sending to appwrite
    try {
        const gameDetails = await updateDocument("games", eventId, {
            playerChart: JSON.stringify(playerChart),
        });

        // Send notification to team members if requested and lineup is not null
        if (sendNotification && playerChart && gameDetails) {
            try {
                // Get team members to notify
                const teamId = gameDetails.teamId;
                if (teamId) {
                    const userIds = await getNotifiableTeamMembers(teamId);

                    if (userIds.length > 0) {
                        // Build game name from opponent or generic
                        const gameName = gameDetails.opponent
                            ? `Game vs ${gameDetails.opponent}`
                            : "Upcoming Game";

                        await sendLineupFinalizedNotification({
                            gameId: eventId,
                            teamId,
                            userIds,
                            gameName,
                        });
                    }
                }
            } catch (notificationError) {
                // Log but don't fail the save operation if notification fails
                console.error(
                    "Error sending lineup notification:",
                    notificationError,
                );
            }
        }

        return {
            response: { gameDetails },
            status: 204,
            success: true,
            event: {
                name: sendNotification ? "lineup-notified" : "lineup-saved",
                data: {
                    eventId,
                },
            },
        };
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

        return {
            response: { teamDetails },
            status: 204,
            success: true,
            event: {
                name: "update-ideal-lineup",
                data: { teamId },
            },
        };
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

        return {
            response: { teamDetails },
            status: 204,
            success: true,
            event: {
                name: "update-depth-chart",
                data: { teamId },
            },
        };
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
