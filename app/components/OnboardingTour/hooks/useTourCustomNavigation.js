import { useEffect, useRef } from "react";

/**
 * Custom hook to handle custom onboarding-next-step event dispatches to advance the tour index,
 * optionally applying target-specific timeouts (e.g. Confirm Play network latency buffer).
 *
 * @param {Object} params
 * @param {boolean} params.runTour - Indicates if the tour is active.
 * @param {number} params.stepIndex - Current step index.
 * @param {Array<Object>} params.activeSteps - Filtered list of steps for the tour.
 * @param {Function} params.setStepIndex - State setter for current step index.
 */
export function useTourCustomNavigation({
    runTour,
    stepIndex,
    activeSteps,
    setStepIndex,
}) {
    const timeoutRef = useRef(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Clear timeout when tour stops
    useEffect(() => {
        if (!runTour && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [runTour]);

    useEffect(() => {
        const handleNextStep = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (runTour && stepIndex < activeSteps.length - 1) {
                const currentStep = activeSteps[stepIndex];
                const currentTarget =
                    typeof currentStep.target === "function"
                        ? currentStep.target()
                        : currentStep.target;

                let delay = 0;
                if (currentTarget === ".tour-action-1b") {
                    delay = 600;
                } else if (currentTarget === ".tour-spray-field") {
                    delay = 350;
                } else if (currentTarget === ".tour-confirm-play-btn") {
                    delay = 3000;
                } else if (currentTarget === ".tour-last-play-card") {
                    delay = 800;
                }

                if (delay > 0) {
                    timeoutRef.current = setTimeout(() => {
                        setStepIndex((prev) => prev + 1);
                    }, delay);
                } else {
                    setStepIndex((prev) => prev + 1);
                }
            }
        };

        window.addEventListener("onboarding-next-step", handleNextStep);
        return () => {
            window.removeEventListener("onboarding-next-step", handleNextStep);
        };
    }, [runTour, stepIndex, activeSteps, setStepIndex]);
}
