import { useState, useEffect, useRef } from "react";

export function useGameState({ logs, game, playerChart }) {
    const [inning, setInning] = useState(1);
    const [halfInning, setHalfInning] = useState("top");
    const [outs, setOuts] = useState(0);
    const [score, setScore] = useState(Number(game.score || 0));
    const [opponentScore, setOpponentScore] = useState(
        Number(game.opponentScore || 0),
    );
    const [runners, setRunners] = useState({
        first: false,
        second: false,
        third: false,
    });
    const [battingOrderIndex, setBattingOrderIndex] = useState(0);

    // Use a ref to avoid re-syncing from old data during fetcher submission
    const lastSyncLogId = useRef(null);

    // Sync state from logs on load or update
    useEffect(() => {
        // Skip sync if we have no logs or if we've already synced this latest log
        const latestLogId =
            logs.length > 0 ? logs[logs.length - 1].$id : "empty";
        if (latestLogId === lastSyncLogId.current) return;

        // 1. Current Batter Index
        // Calculate based on the last logged batter to handle undo correctly
        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            // Find the last batter's index in the player chart
            const lastBatterIndex = playerChart.findIndex(
                (p) => p.$id === lastLog.playerId,
            );
            // Next batter is the one after the last logged batter
            const nextIndex =
                lastBatterIndex >= 0
                    ? (lastBatterIndex + 1) % playerChart.length
                    : 0;
            setBattingOrderIndex(nextIndex);
        } else {
            // No logs yet, start with first batter
            setBattingOrderIndex(0);
        }

        // 2. Score Calculation
        const teamRBIs = logs.reduce((acc, l) => acc + (Number(l.rbi) || 0), 0);
        setScore(Number(game.score || 0) + teamRBIs);
        setOpponentScore(Number(game.opponentScore || 0));

        // 3. Game State (Inning, Half, Outs, Runners)
        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            let currentInning = parseInt(lastLog.inning) || 1;
            let currentHalf = lastLog.halfInning || "top";

            // Sum outs in the CURRENT half inning
            const currentHalfLogs = logs.filter(
                (l) =>
                    parseInt(l.inning) === currentInning &&
                    l.halfInning === currentHalf,
            );
            let currentOuts = currentHalfLogs.reduce(
                (acc, l) => acc + (Number(l.outsOnPlay) || 0),
                0,
            );

            let currentRunners = { first: false, second: false, third: false };
            try {
                if (lastLog.baseState) {
                    currentRunners = JSON.parse(lastLog.baseState);
                }
            } catch (e) {
                console.warn("Failed to parse base state from log", lastLog);
            }

            // If the last play ended the half inning, advance it
            if (currentOuts >= 3) {
                currentOuts = 0;
                currentRunners = { first: false, second: false, third: false };
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
            setRunners({ first: false, second: false, third: false });
        }

        // Mark this log ID as synced
        lastSyncLogId.current = latestLogId;
    }, [logs, playerChart.length, game.score, game.opponentScore]);

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
    };
}
