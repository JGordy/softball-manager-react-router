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
        const safeBaseState =
            baseState != null && typeof baseState === "object"
                ? baseState
                : typeof baseState === "string"
                  ? (() => {
                        try {
                            return JSON.parse(baseState) ?? {};
                        } catch {
                            return {};
                        }
                    })()
                  : {};

        // Validate that safeBaseState is serializable
        let serializedBaseState;
        try {
            serializedBaseState = JSON.stringify(safeBaseState);
        } catch (stringifyError) {
            return {
                success: false,
                message: `Invalid baseState data: ${stringifyError.message}`,
                error: stringifyError.message,
            };
        }

        // Parse runnerResults if provided as a JSON string (e.g. from FormData)
        let parsedRunnerResults = runnerResults;
        if (typeof runnerResults === "string" && runnerResults) {
            try {
                parsedRunnerResults = JSON.parse(runnerResults);
            } catch {
                parsedRunnerResults = null;
            }
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
            baseState: parsedRunnerResults
                ? JSON.stringify({
                      ...JSON.parse(serializedBaseState),
                      runnerResults: parsedRunnerResults,
                  })
                : serializedBaseState,
            hitX: normalizeOptionalField(hitX, parseFloat),
            hitY: normalizeOptionalField(hitY, parseFloat),
            hitLocation: normalizeOptionalField(hitLocation),
            battingSide: normalizeOptionalField(battingSide),
            scored:
                safeBaseState.scored && Array.isArray(safeBaseState.scored)
                    ? safeBaseState.scored
                    : [],
        };

        const isHomeTeam =
            game?.isHomeGame === true || game?.isHomeGame === "true";
        const isOpponent =
            eventType === "opponent_run" ||
            (game != null &&
                (isHomeTeam ? halfInning === "top" : halfInning === "bottom"));

        // If runs > 0, use transaction for atomicity
        if (runs > 0) {
            transaction = await createTransaction();
            const logId = ID.unique();

            // Read current score to calculate new score
            const scoreField = isOpponent ? "opponentScore" : "score";
            const currentScore = parseInt(game[scoreField] || 0, 10);
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
                        [scoreField]: String(newScore),
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
            const isHomeTeam =
                game?.isHomeGame === true || game?.isHomeGame === "true";
            const isOpponent =
                log.eventType === "opponent_run" ||
                (game != null &&
                    (isHomeTeam
                        ? log.halfInning === "top"
                        : log.halfInning === "bottom"));

            const scoreField = isOpponent ? "opponentScore" : "score";
            const currentScore = parseInt(game[scoreField] || 0, 10);
            const newScore = Math.max(0, currentScore - runs);

            // Stage operations in transaction: update score first, then delete log
            const operations = [
                {
                    action: "update",
                    databaseId,
                    tableId: collections.games,
                    rowId: log.gameId,
                    data: {
                        [scoreField]: String(newScore),
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

            return { success: true, log };
        } else {
            // No score to revert, just delete the log
            await deleteDocument("game_logs", logId, client);
            return { success: true, log };
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

    try {
        // 1. Fetch the original log
        const oldLog = await readDocument("game_logs", logId, [], client);
        const gameId = oldLog.gameId;

        const oldRbi = parseInt(oldLog.rbi || 0, 10);
        const newRbi =
            "rbi" in newData ? parseInt(newData.rbi || 0, 10) : oldRbi;
        const rbiDelta = newRbi - oldRbi;

        // Parse and validate baseState — fall back to existing log if omitted
        let parsedBase;
        try {
            const raw = newData.baseState ?? oldLog.baseState;
            const candidate =
                typeof raw === "string" ? JSON.parse(raw) : (raw ?? {});
            parsedBase =
                candidate &&
                typeof candidate === "object" &&
                !Array.isArray(candidate)
                    ? candidate
                    : {};
        } catch {
            return {
                success: false,
                status: 400,
                message: "Invalid baseState JSON.",
            };
        }

        // Parse and validate runnerResults
        let parsedRunnerResults = null;
        if (newData.runnerResults != null) {
            try {
                parsedRunnerResults =
                    typeof newData.runnerResults === "string"
                        ? JSON.parse(newData.runnerResults)
                        : newData.runnerResults;
            } catch {
                return {
                    success: false,
                    status: 400,
                    message: "Invalid runnerResults JSON.",
                };
            }
        }

        // 2. Prepare log payload
        // Normalize optional string fields that can arrive as the literal string "null" from fetcher.submit
        const sanitizedNewData = { ...newData };
        for (const field of ["hitLocation", "battingSide"]) {
            if (field in sanitizedNewData) {
                sanitizedNewData[field] = normalizeOptionalField(
                    sanitizedNewData[field],
                );
            }
        }

        const logPayload = {
            ...sanitizedNewData,
            rbi: newRbi,
            outsOnPlay:
                "outsOnPlay" in newData
                    ? parseInt(newData.outsOnPlay || 0, 10)
                    : parseInt(oldLog.outsOnPlay || 0, 10),
            inning: parseInt(newData.inning || oldLog.inning, 10),
            hitX:
                "hitX" in newData
                    ? normalizeOptionalField(newData.hitX, (value) => {
                          const parsedValue = parseFloat(value);
                          return Number.isFinite(parsedValue)
                              ? parsedValue
                              : null;
                      })
                    : oldLog.hitX,
            hitY:
                "hitY" in newData
                    ? normalizeOptionalField(newData.hitY, (value) => {
                          const parsedValue = parseFloat(value);
                          return Number.isFinite(parsedValue)
                              ? parsedValue
                              : null;
                      })
                    : oldLog.hitY,
            // Bundle runnerResults into baseState for storage
            baseState: JSON.stringify({
                ...parsedBase,
                ...(parsedRunnerResults && {
                    runnerResults: parsedRunnerResults,
                }),
            }),
            scored:
                parsedBase.scored && Array.isArray(parsedBase.scored)
                    ? parsedBase.scored
                    : [],
        };
        // Remove runnerResults from payload as it's not a root attribute
        delete logPayload.runnerResults;
        const wasOpponent =
            oldLog.eventType === "opponent_run" ||
            (() => {
                try {
                    const parsed =
                        typeof oldLog.baseState === "string"
                            ? JSON.parse(oldLog.baseState)
                            : oldLog.baseState;
                    return !!parsed?.isOpponent;
                } catch (_e) {
                    return false;
                }
            })();

        const isOpponent =
            (newData.eventType || oldLog.eventType) === "opponent_run" ||
            (() => {
                try {
                    const parsed =
                        typeof logPayload.baseState === "string"
                            ? JSON.parse(logPayload.baseState)
                            : logPayload.baseState;
                    return !!parsed?.isOpponent;
                } catch (_e) {
                    return false;
                }
            })();

        // 4. Update log and game score using the user-scoped client
        if (wasOpponent === isOpponent) {
            // No type transition: update a single field by rbiDelta if rbiDelta is non-zero
            if (rbiDelta !== 0) {
                const game = await readDocument("games", gameId, [], client);
                const scoreField = isOpponent ? "opponentScore" : "score";
                const currentScore = parseInt(game[scoreField] || 0, 10);
                const newScore = Math.max(0, currentScore + rbiDelta);

                await updateDocument(
                    "games",
                    gameId,
                    { [scoreField]: String(newScore) },
                    client,
                );
                try {
                    await updateDocument(
                        "game_logs",
                        logId,
                        logPayload,
                        client,
                    );
                } catch (logErr) {
                    console.error(
                        "Log update failed after score update; attempting score rollback:",
                        logErr,
                    );
                    try {
                        await updateDocument(
                            "games",
                            gameId,
                            { [scoreField]: String(currentScore) },
                            client,
                        );
                    } catch (rollbackErr) {
                        console.error("Score rollback failed:", rollbackErr);
                    }
                    throw logErr;
                }
            } else {
                await updateDocument("game_logs", logId, logPayload, client);
            }
        } else {
            // Type transition!
            // Deduct oldRbi from old score field, and add newRbi to new score field
            const game = await readDocument("games", gameId, [], client);
            const oldScoreField = wasOpponent ? "opponentScore" : "score";
            const newScoreField = isOpponent ? "opponentScore" : "score";

            const currentOldScore = parseInt(game[oldScoreField] || 0, 10);
            const currentNewScore = parseInt(game[newScoreField] || 0, 10);

            const nextOldScore = Math.max(0, currentOldScore - oldRbi);
            const nextNewScore = Math.max(0, currentNewScore + newRbi);

            await updateDocument(
                "games",
                gameId,
                {
                    [oldScoreField]: String(nextOldScore),
                    [newScoreField]: String(nextNewScore),
                },
                client,
            );
            try {
                await updateDocument("game_logs", logId, logPayload, client);
            } catch (logErr) {
                console.error(
                    "Log update failed after transition score update; attempting rollback:",
                    logErr,
                );
                try {
                    await updateDocument(
                        "games",
                        gameId,
                        {
                            [oldScoreField]: String(currentOldScore),
                            [newScoreField]: String(currentNewScore),
                        },
                        client,
                    );
                } catch (rollbackErr) {
                    console.error(
                        "Score transition rollback failed:",
                        rollbackErr,
                    );
                }
                throw logErr;
            }
        }

        // 5. Experimental Propagation logic:
        // If the stored base state changed and propagate is true, try to fix the next log
        if (propagate && logPayload.baseState !== oldLog.baseState) {
            await propagateBaseStateChange(
                gameId,
                logId,
                oldLog.baseState,
                logPayload.baseState,
                client,
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating game event:", error);
        return {
            success: false,
            message: "Failed to update event.",
            error: error.message,
        };
    }
};

/**
 * Propagates a baseState change to subsequent logs if appropriate.
 * Highly experimental "best effort" to maintain game state consistency.
 * Uses an iterative approach to avoid O(n²) queries.
 */
async function propagateBaseStateChange(
    gameId,
    changedLogId,
    previousBaseState,
    newBaseState,
    client,
) {
    const MAX_PROPAGATION_STEPS = 10;

    try {
        let currentLogId = changedLogId;
        let expectedPreviousState = previousBaseState;
        let steps = 0;

        while (currentLogId) {
            if (steps >= MAX_PROPAGATION_STEPS) {
                console.warn(
                    `propagateBaseStateChange: hit max iteration cap (${MAX_PROPAGATION_STEPS}) for game ${gameId}`,
                );
                return;
            }
            steps++;
            // Fetch only the immediately next log after the current one
            const nextLogRes = await listDocuments(
                "game_logs",
                [
                    Query.equal("gameId", gameId),
                    Query.orderAsc("$createdAt"),
                    Query.cursorAfter(currentLogId),
                    Query.limit(1),
                ],
                client,
            );

            const nextLog = nextLogRes.rows?.[0];
            if (!nextLog) return;

            // Identity propagation: only overwrite if the next log's baseState
            // matches the old value (i.e. it was a direct copy with no movement)
            if (nextLog.baseState !== expectedPreviousState) return;

            await updateDocument(
                "game_logs",
                nextLog.$id,
                { baseState: newBaseState },
                client,
            );

            // Advance forward — the next log's old state was expectedPreviousState
            expectedPreviousState = nextLog.baseState;
            currentLogId = nextLog.$id;
        }
    } catch (e) {
        console.warn("Failed to propagate base state change:", e);
    }
}
