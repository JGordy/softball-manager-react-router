import { useState } from "react";

/**
 * Hook to manage runner projection logic.
 * Handles initialization of runner states based on actionType ("guesses")
 * and calculates the projected final state.
 */
export function useRunnerProjection({ opened, actionType, runners, _outs }) {
    const [runnerResults, setRunnerResults] = useState({});
    const [prevProps, setPrevProps] = useState({
        actionType: null,
        runners: null,
    });

    // Sync state initialization during render if props change
    if (
        opened &&
        (actionType !== prevProps.actionType || runners !== prevProps.runners)
    ) {
        const isHit = ["1B", "2B", "3B", "HR", "E", "FC"].includes(actionType);
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
        setPrevProps({ actionType, runners });
    }

    // Reset local state when drawer closes
    if (!opened && Object.keys(runnerResults).length > 0) {
        setRunnerResults({});
        setPrevProps({ actionType: null, runners: null });
    }

    // Final derived state
    const runsScored = Object.values(runnerResults).filter(
        (v) => v === "score",
    ).length;
    const outsRecorded = Object.values(runnerResults).filter(
        (v) => v === "out",
    ).length;

    const occupiedBases = {
        first: Object.values(runnerResults).some((v) => v === "first"),
        second: Object.values(runnerResults).some((v) => v === "second"),
        third: Object.values(runnerResults).some((v) => v === "third"),
    };

    return {
        runnerResults,
        setRunnerResults,
        runsScored,
        outsRecorded,
        occupiedBases,
    };
}
