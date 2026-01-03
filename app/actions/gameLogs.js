import { createDocument, deleteDocument } from "@/utils/databases";

const eventTypeOptions = {
    "1B": "single",
    "2B": "double",
    "3B": "triple",
    HR: "homerun",
    BB: "walk",
    "Ground Out": "out",
    "Fly Out": "out",
    "Line Out": "out",
    "Pop Out": "out",
    K: "out",
    E: "error",
    FC: "fielders_choice",
};

export const logGameEvent = async ({
    gameId,
    inning,
    halfInning,
    playerId,
    eventType,
    rbi,
    outsOnPlay,
    description,
    baseState,
}) => {
    try {
        const response = await createDocument("game_logs", null, {
            gameId,
            inning: parseInt(inning),
            halfInning,
            playerId,
            eventType: eventTypeOptions[eventType],
            rbi: parseInt(rbi),
            outsOnPlay: parseInt(outsOnPlay),
            description,
            baseState: JSON.stringify(baseState),
        });
        return { success: true, log: response };
    } catch (error) {
        console.error("Error logging game event:", error);
        return { success: false, error: error.message };
    }
};

export const undoLastGameEvent = async ({ logId }) => {
    try {
        await deleteDocument("game_logs", logId);
        return { success: true };
    } catch (error) {
        console.error("Error undoing last game event:", error);
        return { success: false, error: error.message };
    }
};
