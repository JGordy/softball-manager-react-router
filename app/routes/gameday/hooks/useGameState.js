import { useState, useEffect, useRef } from "react";
import {
    isOpponentPlay,
    getNextBatterIndex,
    getFirstBatterIndex,
} from "../utils/gamedayUtils";

export function useGameState({ logs, game, playerChart, opponentChart }) {
    const [inning, setInning] = useState(1);
    const [halfInning, setHalfInning] = useState("top");
    const [outs, setOuts] = useState(0);
    const [score, setScore] = useState(Number(game.score || 0));
    const [opponentScore, setOpponentScore] = useState(
        Number(game.opponentScore || 0),
    );
    const [runners, setRunners] = useState({
        first: null,
        second: null,
        third: null,
    });
    const [battingOrderIndex, setBattingOrderIndex] = useState(0);
    const [opponentOrderIndex, setOpponentOrderIndex] = useState(0);

    // Use a ref to avoid re-syncing from old data during fetcher submission
    const lastSyncLogId = useRef(null);

    // Sync state from logs on load or update
    useEffect(() => {
        // Safety check: ensure playerChart exists
        if (!playerChart || playerChart.length === 0) return;

        // 1. Current Batter Indexes (Ours and Opponent's)
        // Calculate based on the last logged batter to handle undo correctly
        if (logs.length > 0) {
            // Find the last log for our team
            let lastOurAtBatLog = null;
            // Find the last log for the opponent
            let lastOpponentAtBatLog = null;

            for (let i = logs.length - 1; i >= 0; i--) {
                const log = logs[i];
                if (
                    log.eventType !== "SUB" &&
                    log.eventType !== "INJURY_REMOVE"
                ) {
                    if (isOpponentPlay(log, game.isHomeGame)) {
                        if (!lastOpponentAtBatLog && log.playerId) {
                            lastOpponentAtBatLog = log;
                        }
                    } else {
                        if (!lastOurAtBatLog) {
                            lastOurAtBatLog = log;
                        }
                    }
                }
                if (lastOurAtBatLog && lastOpponentAtBatLog) break;
            }

            if (lastOurAtBatLog) {
                const lastBatterIndex = playerChart.findIndex(
                    (p) =>
                        p.$id === lastOurAtBatLog.playerId ||
                        p.substitutions?.some(
                            (s) => s.playerId === lastOurAtBatLog.playerId,
                        ),
                );
                const nextIndex =
                    lastBatterIndex >= 0
                        ? getNextBatterIndex(lastBatterIndex, playerChart)
                        : getFirstBatterIndex(playerChart);
                setBattingOrderIndex(nextIndex);
            } else {
                setBattingOrderIndex(getFirstBatterIndex(playerChart));
            }

            if (lastOpponentAtBatLog) {
                let nextOpponentIndex = 0;

                if (opponentChart && opponentChart.length > 0) {
                    const lastOpponentIndex = opponentChart.findIndex(
                        (p) => p.$id === lastOpponentAtBatLog.playerId,
                    );

                    if (lastOpponentIndex >= 0) {
                        if (
                            lastOpponentAtBatLog.eventType ===
                            "opponent_lineup_pointer"
                        ) {
                            nextOpponentIndex = lastOpponentIndex;
                        } else if (game.opponentLineupLocked) {
                            nextOpponentIndex =
                                (lastOpponentIndex + 1) % opponentChart.length;
                        } else {
                            nextOpponentIndex = lastOpponentIndex + 1;
                        }
                    } else {
                        const match =
                            lastOpponentAtBatLog.playerId?.match(
                                /OPP_BAT_(\d+)/,
                            );
                        if (match) {
                            const index = parseInt(match[1], 10) - 1;
                            if (
                                lastOpponentAtBatLog.eventType ===
                                "opponent_lineup_pointer"
                            ) {
                                nextOpponentIndex = index;
                            } else {
                                nextOpponentIndex = index + 1;
                            }
                        }
                    }
                } else {
                    const match =
                        lastOpponentAtBatLog.playerId?.match(/OPP_BAT_(\d+)/);
                    if (match) {
                        const index = parseInt(match[1], 10) - 1;
                        if (
                            lastOpponentAtBatLog.eventType ===
                            "opponent_lineup_pointer"
                        ) {
                            nextOpponentIndex = index;
                        } else {
                            nextOpponentIndex = index + 1;
                        }
                    }
                }
                setOpponentOrderIndex(nextOpponentIndex);
            } else {
                setOpponentOrderIndex(0);
            }
        } else {
            // No logs yet
            setBattingOrderIndex(0);
            setOpponentOrderIndex(0);
        }

        // 2. Score Calculation
        // Favor calculated score from logs to ensure UI consistency and avoid document staleness.
        // If logs exist, they are the source of truth for the batting team's score.
        const logBasedScore = logs.reduce(
            (acc, l) =>
                acc +
                (isOpponentPlay(l, game.isHomeGame) ? 0 : Number(l.rbi) || 0),
            0,
        );
        const finalScore =
            logs.length > 0
                ? logBasedScore
                : Math.max(logBasedScore, Number(game.score || 0));

        const logBasedOpponentScore = logs.reduce(
            (acc, l) =>
                acc +
                (isOpponentPlay(l, game.isHomeGame) ? Number(l.rbi) || 0 : 0),
            0,
        );
        const finalOpponentScore = Math.max(
            logBasedOpponentScore,
            Number(game.opponentScore || 0),
        );

        setScore(finalScore);
        setOpponentScore(finalOpponentScore);

        // 3. Game State (Inning, Half, Outs, Runners)
        const latestLogId =
            logs.length > 0 ? logs[logs.length - 1].$id : "empty";
        if (latestLogId === lastSyncLogId.current) return;
        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            let currentInning = parseInt(lastLog.inning, 10) || 1;
            let currentHalf = lastLog.halfInning || "top";

            // Sum outs in the CURRENT half inning
            const currentHalfLogs = logs.filter(
                (l) =>
                    parseInt(l.inning, 10) === currentInning &&
                    l.halfInning === currentHalf,
            );
            let currentOuts = currentHalfLogs.reduce(
                (acc, l) => acc + (Number(l.outsOnPlay) || 0),
                0,
            );

            let currentRunners = { first: null, second: null, third: null };
            try {
                if (lastLog.baseState) {
                    currentRunners =
                        typeof lastLog.baseState === "string"
                            ? JSON.parse(lastLog.baseState)
                            : lastLog.baseState;
                }
            } catch (e) {
                console.warn("Failed to parse base state from log", lastLog);
            }

            // If the last play ended the half inning, advance it
            if (currentOuts >= 3) {
                currentOuts = 0;
                currentRunners = { first: null, second: null, third: null };
                if (currentHalf === "top") {
                    currentHalf = "bottom";
                } else {
                    currentHalf = "top";
                    currentInning++;
                }
            }

            setInning(currentInning);
            setHalfInning(currentHalf);
            setOuts(currentOuts);
            setRunners(currentRunners);
        } else {
            setInning(1);
            setHalfInning("top"); // Standard start
            setOuts(0);
            setRunners({ first: null, second: null, third: null });
        }

        // Mark this log ID as synced
        lastSyncLogId.current = latestLogId;
    }, [
        logs,
        playerChart,
        opponentChart,
        game.isHomeGame,
        game.opponentLineupLocked,
        game.score,
        game.opponentScore,
    ]);

    return {
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
        opponentOrderIndex,
        setOpponentOrderIndex,
    };
}
