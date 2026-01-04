import { createDocument, deleteDocument } from "@/utils/databases";
import { EVENT_TYPE_MAP } from "@/routes/events/components/scoring/scoringConstants";

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
            eventType: EVENT_TYPE_MAP[eventType],
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

export const undoGameEvent = async ({ logId }) => {
    try {
        await deleteDocument("game_logs", logId);
        return { success: true };
    } catch (error) {
        console.error("Error undoing last game event:", error);
        return { success: false, error: error.message };
    }
};
