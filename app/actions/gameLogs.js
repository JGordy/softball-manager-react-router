import {
    createDocument,
    deleteDocument,
    readDocument,
    createTransaction,
    createOperations,
    commitTransaction,
    rollbackTransaction,
    collections,
} from "@/utils/databases";
import { EVENT_TYPE_MAP } from "@/routes/events/constants/scoringConstants";
import { ID, Permission, Role } from "node-appwrite";

const databaseId = process.env.APPWRITE_DATABASE_ID;

export const logGameEvent = async ({
    gameId,
    teamId: providedTeamId,
    inning,
    halfInning,
    playerId,
    eventType,
    rbi,
    outsOnPlay,
    description,
    baseState,
    hitX,
    hitY,
    hitLocation,
    battingSide,
}) => {
    let transaction = null;

    try {
        const runs = parseInt(rbi, 10) || 0;

        // Fetch game to get teamId if not provided, or if we need score for transaction
        let teamId = providedTeamId;
        let game = null;

        if (!teamId || runs > 0) {
            game = await readDocument("games", gameId);
            if (!teamId) teamId = game?.teamId;
        }

        const teamRoles = ["manager", "owner"];

        const permissions = [
            Permission.read(Role.any()),
            ...teamRoles.map((role) =>
                Permission.update(Role.team(teamId, role)),
            ),
            ...teamRoles.map((role) =>
                Permission.delete(Role.team(teamId, role)),
            ),
        ];

        // Validate baseState before stringify
        let baseStateStr;
        try {
            baseStateStr = JSON.stringify(baseState);
        } catch (stringifyError) {
            console.error("Failed to stringify baseState:", stringifyError);
            return {
                success: false,
                message: `Invalid baseState data: ${stringifyError.message}`,
                error: stringifyError.message,
            };
        }

        // Create log payload
        const logPayload = {
            gameId,
            inning: parseInt(inning, 10),
            halfInning,
            playerId,
            eventType: EVENT_TYPE_MAP[eventType] || eventType,
            rbi: runs,
            outsOnPlay: parseInt(outsOnPlay, 10),
            description,
            baseState: baseStateStr,
            hitX: hitX ? parseFloat(hitX) : null,
            hitY: hitY ? parseFloat(hitY) : null,
            hitLocation,
            battingSide,
        };

        // If runs > 0, use transaction for atomicity
        if (runs > 0) {
            transaction = await createTransaction();
            const logId = ID.unique();

            // Read current score to calculate new score
            const currentScore = parseInt(game.score || 0, 10);
            const newScore = currentScore + runs;

            // Stage operations in transaction
            const operations = [
                {
                    action: "create",
                    databaseId,
                    tableId: collections.game_logs,
                    rowId: logId,
                    data: logPayload,
                    permissions,
                },
                {
                    action: "update",
                    databaseId,
                    tableId: collections.games,
                    rowId: gameId,
                    data: {
                        score: String(newScore),
                    },
                },
            ];

            await createOperations(transaction.$id, operations);
            await commitTransaction(transaction.$id);

            return { success: true, log: { $id: logId } };
        } else {
            // No score update needed, just create the log
            const response = await createDocument(
                "game_logs",
                null,
                logPayload,
                permissions,
            );

            return { success: true, log: response };
        }
    } catch (error) {
        console.error("Error logging game event:", error);

        // Rollback transaction if it was created
        if (transaction) {
            try {
                await rollbackTransaction(transaction.$id);
            } catch (rollbackError) {
                console.error("Failed to rollback transaction:", rollbackError);
            }
        }

        return {
            success: false,
            message: "Failed to log event. Please try again.",
            error: error.message,
        };
    }
};

export const undoGameEvent = async ({ logId }) => {
    let transaction = null;

    try {
        // 1. Fetch the log to see if we need to revert score
        const log = await readDocument("game_logs", logId);
        const runs = parseInt(log.rbi || 0, 10);

        // 2. If the log had runs, use transaction for atomic undo
        if (runs > 0) {
            transaction = await createTransaction();

            // Read current score to calculate reverted score
            const game = await readDocument("games", log.gameId);
            const currentScore = parseInt(game.score || 0, 10);
            const newScore = Math.max(0, currentScore - runs);

            // Stage operations in transaction: update score first, then delete log
            const operations = [
                {
                    action: "update",
                    databaseId,
                    tableId: collections.games,
                    rowId: log.gameId,
                    data: {
                        score: String(newScore),
                    },
                },
                {
                    action: "delete",
                    databaseId,
                    tableId: collections.game_logs,
                    rowId: logId,
                },
            ];

            await createOperations(transaction.$id, operations);
            await commitTransaction(transaction.$id);

            return { success: true };
        } else {
            // No score to revert, just delete the log
            await deleteDocument("game_logs", logId);
            return { success: true };
        }
    } catch (error) {
        console.error("Error undoing game event:", error);

        // Rollback transaction if it was created
        if (transaction) {
            try {
                await rollbackTransaction(transaction.$id);
            } catch (rollbackError) {
                console.error("Failed to rollback transaction:", rollbackError);
            }
        }

        return {
            success: false,
            message: "Failed to undo event. Please try again.",
            error: error.message,
        };
    }
};
