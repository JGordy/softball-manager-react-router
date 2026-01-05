import {
    createDocument,
    deleteDocument,
    readDocument,
    updateDocument,
} from "@/utils/databases";
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
        const runs = parseInt(rbi, 10) || 0;

        // 1. Log the event
        const response = await createDocument("game_logs", null, {
            gameId,
            inning: parseInt(inning, 10),
            halfInning,
            playerId,
            eventType: EVENT_TYPE_MAP[eventType] || eventType,
            rbi: runs,
            outsOnPlay: parseInt(outsOnPlay, 10),
            description,
            baseState: JSON.stringify(baseState),
        });

        // 2. If runs were scored, update the game document
        if (runs > 0) {
            try {
                const game = await readDocument("games", gameId);
                const currentScore = parseInt(game.score || 0, 10);
                await updateDocument("games", gameId, {
                    score: String(currentScore + runs),
                });
            } catch (scoreError) {
                console.error("Failed to update game score:", scoreError);
                // Rollback: delete the log that was just created
                try {
                    await deleteDocument("game_logs", response.$id);
                } catch (deleteError) {
                    console.error("Failed to rollback game log:", deleteError);
                }
                return {
                    success: false,
                    message: "Failed to update score. Event was not logged.",
                    error: scoreError.message,
                };
            }
        }

        return { success: true, log: response };
    } catch (error) {
        console.error("Error logging game event:", error);
        return { success: false, error: error.message };
    }
};

export const undoGameEvent = async ({ logId }) => {
    try {
        // 1. Fetch the log to see if we need to revert score
        const log = await readDocument("game_logs", logId);
        const runs = parseInt(log.rbi || 0, 10);

        // 2. If the log had runs, decrement the game score
        if (runs > 0) {
            try {
                const game = await readDocument("games", log.gameId);
                const currentScore = parseInt(game.score || 0, 10);
                const newScore = Math.max(0, currentScore - runs);
                await updateDocument("games", log.gameId, {
                    score: String(newScore),
                });
            } catch (scoreError) {
                console.error("Failed to revert game score:", scoreError);
                return {
                    success: false,
                    message: "Failed to revert score. Please refresh the page.",
                    error: scoreError.message,
                };
            }
        }

        // 3. Delete the log
        await deleteDocument("game_logs", logId);
        return { success: true };
    } catch (error) {
        console.error("Error undoing last game event:", error);
        return { success: false, error: error.message };
    }
};
