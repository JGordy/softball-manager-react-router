import { useEffect } from "react";

/**
 * Custom hook to register global click and touch event listeners during the tour.
 * It detects clicks on target selectors and dispatches transition events to advance the steps.
 *
 * @param {Object} params
 * @param {boolean} params.runTour - Indicates if the tour is active.
 * @param {number} params.stepIndex - Current step index.
 * @param {Array<Object>} params.activeSteps - Filtered list of steps for the tour.
 * @param {React.MutableRefObject<number>} params.lastProcessedStepRef - Ref tracking the last processed step to avoid double-triggers.
 */
export function useTourGlobalClick({
    runTour,
    stepIndex,
    activeSteps,
    lastProcessedStepRef,
}) {
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (!runTour || (!e.isTrusted && process.env.NODE_ENV !== "test"))
                return;
            if (stepIndex === lastProcessedStepRef.current) return;

            const currentStep = activeSteps[stepIndex];
            if (!currentStep) return;

            const target =
                typeof currentStep.target === "function"
                    ? currentStep.target()
                    : currentStep.target;
            if (typeof target !== "string") return;

            const targetEl = document.querySelector(target);
            const isClickOnTarget =
                (targetEl &&
                    (targetEl === e.target || targetEl.contains(e.target))) ||
                (e.target.closest && e.target.closest(target));

            if (isClickOnTarget) {
                if (
                    target === ".tour-action-1b" ||
                    target === ".tour-confirm-play-btn"
                ) {
                    lastProcessedStepRef.current = stepIndex;
                    window.dispatchEvent(
                        new CustomEvent("onboarding-next-step"),
                    );
                } else if (target === ".tour-spray-field") {
                    lastProcessedStepRef.current = stepIndex;
                    const proceedBtn = document.querySelector(
                        ".tour-proceed-advancement-btn",
                    );
                    if (proceedBtn) {
                        setTimeout(() => {
                            proceedBtn.click();
                        }, 100);
                    }
                    window.dispatchEvent(
                        new CustomEvent("onboarding-next-step"),
                    );
                } else if (target === ".tour-last-play-card") {
                    const cardEl = e.target.closest(".tour-last-play-card");
                    const undoBtn = cardEl
                        ? cardEl.querySelector(".tour-undo-play-btn")
                        : null;
                    if (
                        undoBtn &&
                        (undoBtn === e.target || undoBtn.contains(e.target))
                    ) {
                        lastProcessedStepRef.current = stepIndex;
                        window.dispatchEvent(
                            new CustomEvent("onboarding-next-step"),
                        );
                    }
                }
            }
        };

        window.addEventListener("click", handleGlobalClick, true);
        window.addEventListener("pointerup", handleGlobalClick, true);
        window.addEventListener("mouseup", handleGlobalClick, true);
        return () => {
            window.removeEventListener("click", handleGlobalClick, true);
            window.removeEventListener("pointerup", handleGlobalClick, true);
            window.removeEventListener("mouseup", handleGlobalClick, true);
        };
    }, [runTour, stepIndex, activeSteps, lastProcessedStepRef]);
}
