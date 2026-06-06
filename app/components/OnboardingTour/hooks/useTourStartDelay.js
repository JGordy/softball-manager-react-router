import { useEffect } from "react";

/**
 * Custom hook to handle starting the onboarding tour on a delay after the component has mounted and page settled.
 *
 * @param {Object} params
 * @param {boolean} params.mounted - Component mount status.
 * @param {boolean} params.hasCompleted - Completion status of the tour.
 * @param {Function} params.setStepIndex - State setter for current step index.
 * @param {Function} params.setRunTour - State setter to trigger running the tour.
 * @param {React.MutableRefObject<boolean>} params.hasSubmittedEndRef - Ref tracking if completion metrics were sent.
 */
export function useTourStartDelay({
    mounted,
    hasCompleted,
    setStepIndex,
    setRunTour,
    hasSubmittedEndRef,
}) {
    useEffect(() => {
        if (mounted && !hasCompleted) {
            if (hasSubmittedEndRef) {
                hasSubmittedEndRef.current = false;
            }
            const timer = setTimeout(() => {
                setStepIndex(0);
                setRunTour(true);
            }, 600);
            return () => clearTimeout(timer);
        } else {
            setRunTour(false);
        }
    }, [mounted, hasCompleted, setStepIndex, setRunTour, hasSubmittedEndRef]);
}
