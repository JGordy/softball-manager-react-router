import { ID, Permission, Role, Query } from "node-appwrite";

import {
    createDocument,
    deleteDocument,
    readDocument,
    updateDocument,
    listDocuments,
    createTransaction,
    createOperations,
    commitTransaction,
    rollbackTransaction,
    collections,
} from "@/utils/databases";

import { EVENT_TYPE_MAP } from "@/constants/scoring";

/**
 * Normalizes optional form fields (e.g. hitX, hitY) that may be "null" strings,
 * empty strings, or undefined, ensuring they are returned as either a
 * parsed numeric/string value or a native null.
 */
function normalizeOptionalField(value, parser = null) {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "null"
    ) {
        return null;
    }

    return parser ? parser(value) : value;
}

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
    runnerResults,
    client,
}) => {
    if (!client) {
        return {
            success: false,
            status: 400,
            message:
                "Missing or invalid Appwrite client provided to logGameEvent.",
            action: "log-game-event",
        };
    }

    let transaction = null;

    try {
        const runs = parseInt(rbi, 10) || 0;

        // Fetch game to get teamId if not provided, or if we need score for transaction
        let teamId = providedTeamId;
        let game = null;

        if (!teamId || runs > 0) {
            game = await readDocument("games", gameId, [], client);
            if (!teamId) teamId = game?.teamId;
        }

        const permissions = [
            Permission.read(Role.any()),
            Permission.update(Role.team(teamId, "scorekeeper")),
            Permission.delete(Role.team(teamId, "scorekeeper")),
        ];

        // Validate baseState before use
        try {
            JSON.stringify(baseState);
        } catch (stringifyError) {
            console.error("Failed to stringify baseState:", stringifyError);
            return {
                success: false,
                message: `Invalid baseState data: ${stringifyError.message}`,
                error: stringifyError.message,
            };
        }

        // Create log payload
        // Note: runnerResults is bundled into baseState to avoid schema errors
        // while preserving movement intent data.
        const logPayload = {
            gameId,
            inning: parseInt(inning, 10),
            halfInning,
            playerId,
            eventType: EVENT_TYPE_MAP[eventType] || eventType,
            rbi: runs,
            outsOnPlay: parseInt(outsOnPlay, 10),
            description,
            baseState: JSON.stringify({
                ...baseState,
                ...(runnerResults && { runnerResults }),
            }),
            hitX: normalizeOptionalField(hitX, parseFloat),
            hitY: normalizeOptionalField(hitY, parseFloat),
            hitLocation: normalizeOptionalField(hitLocation),
            battingSide: normalizeOptionalField(battingSide),
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
            const response = await createDocument(
                "game_logs",
                null,
                logPayload,
                permissions,
                client,
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

export const undoGameEvent = async ({ logId, client }) => {
    if (!client) {
        return {
            success: false,
            status: 400,
            message:
                "Missing or invalid Appwrite client provided to undoGameEvent.",
            action: "undo-game-event",
        };
    }

    let transaction = null;

    try {
        // 1. Fetch the log to see if we need to revert score
        const log = await readDocument("game_logs", logId, [], client);
        const runs = parseInt(log.rbi || 0, 10);

        // 2. If the log had runs, use transaction for atomic undo
        if (runs > 0) {
            transaction = await createTransaction();

            // Read current score to calculate reverted score
            const game = await readDocument("games", log.gameId, [], client);
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
            await deleteDocument("game_logs", logId, client);
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

export const updateGameEvent = async ({
    logId,
    newData,
    client,
    propagate = false,
}) => {
    if (!client) {
        return {
            success: false,
            status: 400,
            message:
                "Missing or invalid Appwrite client provided to updateGameEvent.",
            action: "update-game-event",
        };
    }

    let transaction = null;

    try {
        // 1. Fetch the original log
        const oldLog = await readDocument("game_logs", logId, [], client);
        const gameId = oldLog.gameId;

        const oldRbi = parseInt(oldLog.rbi || 0, 10);
        const newRbi = parseInt(newData.rbi || 0, 10);
        const rbiDelta = newRbi - oldRbi;

        // 2. Fetch game for score update in transaction
        const game = await readDocument("games", gameId, [], client);

        // 3. Prepare log payload
        const logPayload = {
            ...newData,
            rbi: newRbi,
            outsOnPlay: parseInt(newData.outsOnPlay || 0, 10),
            inning: parseInt(newData.inning || oldLog.inning, 10),
            hitX:
                newData.hitX != null &&
                newData.hitX !== "" &&
                newData.hitX !== "null"
                    ? parseFloat(newData.hitX)
                    : null,
            hitY:
                newData.hitY != null &&
                newData.hitY !== "" &&
                newData.hitY !== "null"
                    ? parseFloat(newData.hitY)
                    : null,
            // Bundle runnerResults into baseState for storage
            baseState: JSON.stringify({
                ...(typeof newData.baseState === "string"
                    ? JSON.parse(newData.baseState)
                    : newData.baseState),
                ...(newData.runnerResults && {
                    runnerResults:
                        typeof newData.runnerResults === "string"
                            ? JSON.parse(newData.runnerResults)
                            : newData.runnerResults,
                }),
            }),
        };
        // Remove runnerResults from payload as it's not a root attribute
        delete logPayload.runnerResults;

        // 4. Update with Transaction if score changed
        if (rbiDelta !== 0) {
            transaction = await createTransaction();
            const currentScore = parseInt(game.score || 0, 10);
            const newScore = Math.max(0, currentScore + rbiDelta);

            const operations = [
                {
                    action: "update",
                    databaseId,
                    tableId: collections.game_logs,
                    rowId: logId,
                    data: logPayload,
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
        } else {
            await updateDocument("game_logs", logId, logPayload, client);
        }

        // 5. Experimental Propagation logic:
        // If the base state changed and propagate is true, try to fix the next log
        if (propagate && newData.baseState !== oldLog.baseState) {
            await propagateBaseStateChange(
                gameId,
                logId,
                newData.baseState,
                client,
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating game event:", error);
        if (transaction) {
            try {
                await rollbackTransaction(transaction.$id);
            } catch (rErr) {
                console.error("Rollback failed:", rErr);
            }
        }
        return {
            success: false,
            message: "Failed to update event.",
            error: error.message,
        };
    }
};

/**
 * Propagates a baseState change to the immediately following log if appropriate.
 * Highly experimental "best effort" to maintain game state consistency.
 */
async function propagateBaseStateChange(
    gameId,
    changedLogId,
    newBaseState,
    client,
) {
    try {
        // Fetch all logs for the game to find the next one
        const logsRes = await listDocuments(
            "game_logs",
            [
                Query.equal("gameId", gameId),
                Query.orderAsc("inning"),
                Query.orderAsc("$createdAt"),
            ],
            client,
        );

        const logs = logsRes.documents || [];
        const changedIdx = logs.findIndex((l) => l.$id === changedLogId);
        if (changedIdx === -1 || changedIdx === logs.length - 1) return;

        const nextLog = logs[changedIdx + 1];

        // SIMPLE PROPAGATION: If the next play was "static" (e.g. Strikeout, simple flyout)
        // we might just be able to overwrite its baseState if nothing moved.
        // However, it's safer to just inform the user or do it only if certain.

        // For now, let's just implement the "Identity" propagation:
        // if oldLog.baseState === nextLog.baseState, it likely meant no movement.
        // In that case, nextLog.baseState should now be newBaseState.
        const oldLog = logs[changedIdx];
        if (oldLog.baseState === nextLog.baseState) {
            await updateDocument(
                "game_logs",
                nextLog.$id,
                { baseState: newBaseState },
                client,
            );
            // Recursively attempt to propagate if we just changed the next one too
            await propagateBaseStateChange(
                gameId,
                nextLog.$id,
                newBaseState,
                client,
            );
        }
    } catch (e) {
        console.warn("Failed to propagate base state change:", e);
    }
}
