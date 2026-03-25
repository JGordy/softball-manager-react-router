import { useState, useCallback } from "react";
import { useFetcher } from "react-router";
import { useDisclosure } from "@mantine/hooks";
import { UI_BATTED_OUTS, UI_WALKS } from "@/constants/scoring";
import {
    getEventDescription,
    getActivePlayerInSlot,
    handleWalk,
    handleRunnerResults,
} from "../utils/gamedayUtils";

/**
 * Handles automatic outs for strikeouts.
 * Runners stay in place.
 */
function handleAutomaticOut(runners) {
    return {
        newRunners: { ...runners, scored: [] },
        runsOnPlay: 0,
        outsRecorded: 1,
    };
}

/**
 * Custom hook to handle game actions (scoring, outs, undo, etc.).
 */
export function useGamedayActions({
    playerChart,
    team,
    inning,
    setInning,
    halfInning,
    setHalfInning,
    outs,
    setOuts,
    score,
    setScore,
    opponentScore,
    setOpponentScore,
    runners,
    setRunners,
    battingOrderIndex,
    setBattingOrderIndex,
    logs,
    isScorekeeper = false,
}) {
    const fetcher = useFetcher();
    const [pendingAction, setPendingAction] = useState(null);
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
        useDisclosure(false);

    const isSubmitting = fetcher.state === "submitting";

    const advanceHalfInning = useCallback(() => {
        setOuts(0);
        setRunners({ first: null, second: null, third: null });
        if (halfInning === "top") {
            setHalfInning("bottom");
        } else {
            setHalfInning("top");
            setInning((prev) => prev + 1);
        }
    }, [halfInning, setHalfInning, setInning, setOuts, setRunners]);

    const handleOpponentRun = useCallback(() => {
        setOpponentScore((prev) => prev + 1);

        fetcher.submit(
            { _action: "update-game-score", opponentScore: opponentScore + 1 },
            { method: "post" },
        );
    }, [fetcher, opponentScore, setOpponentScore]);

    const handleOpponentOut = useCallback(() => {
        let isInningOver = false;
        setOuts((prev) => {
            const next = prev + 1;
            if (next >= 3) {
                isInningOver = true;
                return 0;
            }
            return next;
        });

        if (isInningOver || outs + 1 >= 3) {
            advanceHalfInning();
        }
    }, [advanceHalfInning, outs, setOuts]);

    const completeAction = useCallback(
        (actionType, payload = null) => {
            const position = payload?.position || null;
            const runnerResults = payload?.runnerResults || null;
            const hitCoordinates = payload?.hitCoordinates || {
                x: null,
                y: null,
            };
            const hitLocation = payload?.hitLocation || null;
            const battingSide = payload?.battingSide || "right";

            // Resolve the active player for this slot (may be a substitute)
            const slot = playerChart[battingOrderIndex];
            const activePlayer = getActivePlayerInSlot(slot);
            const activePlayerId = activePlayer.playerId ?? activePlayer.$id;
            const batterName =
                `${activePlayer.firstName || ""}${activePlayer.lastName ? " " + activePlayer.lastName : ""}`.trim();

            const description = getEventDescription(
                actionType,
                batterName,
                position,
                runnerResults,
                hitLocation,
            );

            let result;

            if (UI_WALKS.includes(actionType)) {
                result = handleWalk(runners, activePlayerId);
            } else if (runnerResults) {
                result = handleRunnerResults(
                    runnerResults,
                    runners,
                    activePlayerId,
                );
            } else if (
                actionType === "K" ||
                UI_BATTED_OUTS.includes(actionType)
            ) {
                result = handleAutomaticOut(runners);
            } else {
                console.warn(
                    `Unexpected action type without runner results: ${actionType}`,
                );
                result = {
                    newRunners: { ...runners },
                    runsOnPlay: 0,
                    outsRecorded: 0,
                };
            }

            const { newRunners, runsOnPlay, outsRecorded } = result;

            fetcher.submit(
                {
                    _action: "log-game-event",
                    teamId: team.$id,
                    inning,
                    halfInning,
                    playerId: activePlayerId,
                    eventType: actionType,
                    rbi: runsOnPlay,
                    outsOnPlay: outsRecorded,
                    description,
                    hitX: hitCoordinates.x,
                    hitY: hitCoordinates.y,
                    hitLocation,
                    battingSide,
                    baseState: JSON.stringify(newRunners),
                },
                { method: "post" },
            );

            // Update local state ONLY if the user isScorekeeper
            if (isScorekeeper) {
                const newTotalOuts = outs + outsRecorded;
                if (newTotalOuts >= 3) {
                    advanceHalfInning();
                } else {
                    setOuts(newTotalOuts);
                    setRunners(newRunners);
                }

                setScore((prev) => prev + runsOnPlay);
                setBattingOrderIndex(
                    (battingOrderIndex + 1) % playerChart.length,
                );
            }

            setPendingAction(null);
            closeDrawer();
        },
        [
            advanceHalfInning,
            battingOrderIndex,
            isScorekeeper,
            closeDrawer,
            fetcher,
            halfInning,
            inning,
            outs,
            playerChart,
            runners,
            setBattingOrderIndex,
            setOuts,
            setRunners,
            setScore,
            team.$id,
        ],
    );

    /**
     * Performs a mid-game substitution for the current batter slot.
     * @param {Object} incomingPlayer - A player object from availablePlayers
     *   with at minimum { $id, firstName, lastName }
     * @param {number} slotIndex - The playerChart slot index to sub into
     * @param {Array} currentPlayerChart - The current playerChart state
     * @param {Function} onChartUpdate - Callback to update playerChart in parent state
     */
    const handleSubCurrentBatter = useCallback(
        (incomingPlayer, slotIndex, currentPlayerChart, onChartUpdate) => {
            if (!isScorekeeper) return;

            const slot = currentPlayerChart[slotIndex];
            const outgoingPlayer = getActivePlayerInSlot(slot);
            const outgoingName =
                `${outgoingPlayer.firstName || ""}${outgoingPlayer.lastName ? " " + outgoingPlayer.lastName : ""}`.trim();
            const incomingName =
                `${incomingPlayer.firstName || ""}${incomingPlayer.lastName ? " " + incomingPlayer.lastName : ""}`.trim();

            const subEntry = {
                playerId: incomingPlayer.$id,
                firstName: incomingPlayer.firstName,
                lastName: incomingPlayer.lastName,
                entryInning: inning,
            };

            // Build updated chart with the sub pushed into this slot's substitutions
            const updatedChart = currentPlayerChart.map((s, idx) => {
                if (idx !== slotIndex) return s;
                return {
                    ...s,
                    substitutions: [...(s.substitutions || []), subEntry],
                };
            });

            // Notify parent to update local state
            onChartUpdate(updatedChart);

            // Submit a single request to update the chart and log the event together
            fetcher.submit(
                {
                    _action: "substitute-player",
                    playerChart: JSON.stringify(updatedChart),
                    teamId: team.$id,
                    inning,
                    halfInning,
                    playerId: incomingPlayer.$id,
                    eventType: "SUB",
                    rbi: 0,
                    outsOnPlay: 0,
                    description: `${incomingName} enters for ${outgoingName} in slot ${slotIndex + 1}`,
                    hitX: null,
                    hitY: null,
                    hitLocation: null,
                    battingSide: null,
                    baseState: JSON.stringify(runners),
                },
                { method: "post" },
            );
        },
        [fetcher, halfInning, inning, isScorekeeper, runners, team.$id],
    );

    const initiateAction = useCallback(
        (actionType) => {
            if (!isScorekeeper) return;
            if (["K", ...UI_WALKS].includes(actionType)) {
                completeAction(actionType);
            } else {
                setPendingAction(actionType);
                openDrawer();
            }
        },
        [isScorekeeper, completeAction, openDrawer],
    );

    const undoLast = useCallback(
        (revertedChart = null) => {
            if (!isScorekeeper || logs.length === 0) return;
            const lastLog = logs[logs.length - 1];
            if (!lastLog || !lastLog.$id) {
                console.error("Cannot undo: invalid last log", lastLog);
                return;
            }

            const payload = { _action: "undo-game-event", logId: lastLog.$id };
            if (revertedChart) {
                payload.playerChart = JSON.stringify(revertedChart);
            }

            fetcher.submit(payload, { method: "post" });
        },
        [isScorekeeper, fetcher, logs],
    );

    return {
        pendingAction,
        drawerOpened,
        openDrawer,
        closeDrawer,
        advanceHalfInning,
        handleOpponentRun,
        handleOpponentOut,
        initiateAction,
        completeAction,
        handleSubCurrentBatter,
        undoLast,
        isSubmitting,
        fetcher,
    };
}
