import { useState, useEffect } from "react";

/**
 * Hook to manage runner projection logic.
 * Handles initialization of runner states based on actionType ("guesses")
 * and calculates the projected final state.
 */
export function useRunnerProjection({ opened, actionType, runners, outs }) {
    const [runnerResults, setRunnerResults] = useState({});

    // Reset local state when drawer closes
    useEffect(() => {
        if (!opened) {
            setRunnerResults({});
        }
    }, [opened]);

    // Initial "Guess" for runners based on actionType
    useEffect(() => {
        if (opened) {
            const isHit = ["1B", "2B", "3B", "HR", "E", "FC"].includes(
                actionType,
            );

            const results = {
                first: runners.first ? (isHit ? "second" : "stay") : null,
                second: runners.second ? (isHit ? "third" : "stay") : null,
                third: runners.third
                    ? isHit || actionType === "SF"
                        ? "score"
                        : "stay"
                    : null,
                batter: isHit ? "first" : "out",
            };

            // Aggressive advancement for extra base hits
            if (isHit) {
                if (actionType === "2B") {
                    results.batter = "second";
                    if (runners.first) results.first = "third";
                    if (runners.second) results.second = "score";
                } else if (actionType === "3B") {
                    results.batter = "third";
                    if (runners.first) results.first = "score";
                    if (runners.second) results.second = "score";
                } else if (actionType === "HR") {
                    results.batter = "score";
                    if (runners.first) results.first = "score";
                    if (runners.second) results.second = "score";
                    if (runners.third) results.third = "score";
                }
            }

            setRunnerResults(results);
        }
    }, [opened, actionType, runners]);

    // Final derived state
    const runsScored = Object.values(runnerResults).filter(
        (v) => v === "score",
    ).length;
    const outsRecorded = Object.values(runnerResults).filter(
        (v) => v === "out",
    ).length;

    const occupiedBases = {
        first: false,
        second: false,
        third: false,
    };

    Object.entries(runnerResults).forEach(([origin, result]) => {
        if (!result) return;

        let finalBase = null;
        if (result === "stay") {
            if (
                origin === "first" ||
                origin === "second" ||
                origin === "third"
            ) {
                finalBase = origin;
            }
        } else if (
            result === "first" ||
            result === "second" ||
            result === "third"
        ) {
            finalBase = result;
        }

        if (finalBase && finalBase in occupiedBases) {
            occupiedBases[finalBase] = true;
        }
    });

    return {
        runnerResults,
        setRunnerResults,
        runsScored,
        outsRecorded,
        occupiedBases,
    };
}
