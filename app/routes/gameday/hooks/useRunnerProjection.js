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

    /**
     * Calculates the projected state of the game based on the current runner results.
     *
     * @returns {Object} An object containing:
     * - projectedRunners: Mapping of bases to player IDs (or "Batter")
     * - occupiedBases: Boolean mapping of which bases will be occupied
     * - runsScored: Total runs resulting from the play
     * - outsRecorded: Total outs resulting from the play
     */
    const getProjectedState = () => {
        // Track WHO is on which base (playerId or null)
        const projectedRunners = { first: null, second: null, third: null };
        const occupiedBases = { first: false, second: false, third: false };
        let runsScored = 0;
        let outsRecorded = 0;

        // Helper to process a result
        const processResult = (result, runnerId, sourceBase) => {
            if (!result) return;
            if (result === "score") {
                runsScored++;
            } else if (result === "out") {
                outsRecorded++;
            } else if (["first", "second", "third"].includes(result)) {
                projectedRunners[result] = runnerId;
                occupiedBases[result] = true;
            } else if (result === "stay" && sourceBase) {
                projectedRunners[sourceBase] = runnerId;
                occupiedBases[sourceBase] = true;
            }
        };

        if (runnerResults.batter) {
            processResult(runnerResults.batter, "Batter", null);
        }

        // Process existing runners
        const bases = ["first", "second", "third"];
        bases.forEach((base) => {
            if (runners[base]) {
                const result = runnerResults[base];
                processResult(result, runners[base], base);
            }
        });

        return { projectedRunners, occupiedBases, runsScored, outsRecorded };
    };

    return {
        runnerResults,
        setRunnerResults,
        ...getProjectedState(),
    };
}
