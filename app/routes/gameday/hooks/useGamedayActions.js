import { useState, useCallback } from "react";
import { useFetcher } from "react-router";
import { useDisclosure } from "@mantine/hooks";
import { UI_BATTED_OUTS, UI_WALKS } from "@/constants/scoring";
import {
    getEventDescription,
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
    game,
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
        const newOpponentScore = opponentScore + 1;
        setOpponentScore(newOpponentScore);
        fetcher.submit(
            { _action: "update-game-score", opponentScore: newOpponentScore },
            { method: "post" },
        );
    }, [fetcher, opponentScore, setOpponentScore]);

    const handleOpponentOut = useCallback(() => {
        const newOuts = outs + 1;
        if (newOuts >= 3) {
            advanceHalfInning();
        } else {
            setOuts(newOuts);
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

            const batter = playerChart[battingOrderIndex];
            const batterName = `${batter.firstName} ${batter.lastName}`;
            const description = getEventDescription(
                actionType,
                batterName,
                position,
                runnerResults,
                hitLocation,
            );

            let result;

            if (UI_WALKS.includes(actionType)) {
                result = handleWalk(runners, batter.$id);
            } else if (runnerResults) {
                result = handleRunnerResults(
                    runnerResults,
                    runners,
                    batter.$id,
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
                    playerId: batter.$id,
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

    const undoLast = useCallback(() => {
        if (!isScorekeeper || logs.length === 0) return;
        const lastLog = logs[logs.length - 1];
        if (!lastLog || !lastLog.$id) {
            console.error("Cannot undo: invalid last log", lastLog);
            return;
        }
        fetcher.submit(
            { _action: "undo-game-event", logId: lastLog.$id },
            { method: "post" },
        );
    }, [isScorekeeper, fetcher, logs]);

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
        undoLast,
        isSubmitting,
        fetcher,
    };
}
