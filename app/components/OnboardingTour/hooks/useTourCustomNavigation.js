import { useEffect } from "react";

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
    useEffect(() => {
        let timeoutId = null;

        const handleNextStep = () => {
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
                    timeoutId = setTimeout(() => {
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
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [runTour, stepIndex, activeSteps, setStepIndex]);
}
