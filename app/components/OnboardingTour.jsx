import { useState, useEffect } from "react";
import { Joyride, STATUS, EVENTS } from "react-joyride";
import { useFetcher } from "react-router";
import { useJoyrideThemeStyles } from "@/hooks/useJoyrideThemeStyles";

/**
 * OnboardingTour is a reusable guided tour component built on top of React Joyride (v3+).
 * It is fully server-side rendering (SSR) safe and dynamically integrates with
 * the active Mantine color scheme (Light/Dark mode).
 *
 * It automatically starts on page load if the tour hasn't been completed yet,
 * bypassing pulsing beacons entirely (using skipBeacon) and presenting tooltips immediately.
 *
 * @component
 * @param {Object} props
 * @param {string} props.tourKey - Unique identifier for the tour (e.g., 'team_details').
 * @param {Array<Object>} props.steps - Array of React Joyride step objects.
 * @param {Object} [props.user] - Current user data retrieved from Appwrite session.
 * @param {string} [props.menuId] - Optional unique identifier to scope onboarding events for the menu.
 * @returns {React.ReactElement|null} The guided tour or null.
 */
export default function OnboardingTour({
    tourKey,
    steps,
    user,
    menuId,
    alwaysIncludeTargets = [],
}) {
    const [mounted, setMounted] = useState(false);
    const [isDesktopViewport, setIsDesktopViewport] = useState(false);
    const [runTour, setRunTour] = useState(false); // Delayed state to bypass Joyride mounting race conditions
    const [stepIndex, setStepIndex] = useState(0); // Controlled step index to delay transitions and prevent race conditions
    const { options, styles } = useJoyrideThemeStyles();
    const fetcher = useFetcher();

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            setIsDesktopViewport(
                window.matchMedia("(min-width: 62em)").matches,
            );
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const userPrefs = user?.prefs || {};
    const onboardingTours = userPrefs.onboardingTours || {};
    const hasCompleted = onboardingTours[tourKey] === true;

    // Handle delayed start of the tour on mount to ensure all DOM elements are painted
    useEffect(() => {
        if (mounted && !hasCompleted) {
            const timer = setTimeout(() => {
                setStepIndex(0); // Ensure step index is reset to 0 when launching
                setRunTour(true);
            }, 200); // 200ms delay to let the page settle and prevent first-step Floater bugs
            return () => clearTimeout(timer);
        } else {
            setRunTour(false);
        }
    }, [mounted, hasCompleted]);

    if (!mounted) return null;

    // Filter out steps whose targets do not exist in the DOM, and programmatically force-disable
    // beacons on all steps (using Joyride v3's skipBeacon property) so tooltips always open automatically.
    const activeSteps = steps
        .filter((step) => {
            if (typeof document === "undefined") return false;

            // Responsive step gating evaluated client-side to prevent SSR/hydration mismatch
            if (step.responsive === "desktop" && !isDesktopViewport)
                return false;
            if (step.responsive === "mobile" && isDesktopViewport) return false;

            try {
                const target =
                    typeof step.target === "function"
                        ? step.target()
                        : step.target;
                if (typeof target === "string") {
                    // Allow specific targets to bypass the initial DOM existence check
                    // because the menu/tab will be programmatically opened when the step starts.
                    if (alwaysIncludeTargets.includes(target)) {
                        return true;
                    }
                    return !!document.querySelector(target);
                }
                return !!target;
            } catch {
                return false;
            }
        })
        .map((step) => ({
            ...step,
            skipBeacon: true, // Renamed from disableBeacon in Joyride v3
        }));

    if (activeSteps.length === 0) return null;

    /**
     * Handles Joyride status callbacks to capture finished or skipped events
     * and persist completion state back to the server.
     *
     * In Joyride v3, this is passed to onEvent.
     *
     * @param {Object} data - Joyride callback event data payload.
     */
    const handleEvent = (data) => {
        const { status, type, step } = data;

        // Programmatically open/close menu dropdowns and tab panels during step transitions
        if (type === EVENTS.STEP_BEFORE) {
            const target = step?.target;
            const isMenuStep =
                typeof target === "string" && target.includes("menu-section");

            if (menuId) {
                if (isMenuStep) {
                    // Ensure the menu is open by dispatching our custom controlled event
                    window.dispatchEvent(
                        new CustomEvent("toggle-onboarding-menu", {
                            detail: { open: true, menuId },
                        }),
                    );
                } else {
                    // If it's not a menu step, close the menu
                    window.dispatchEvent(
                        new CustomEvent("toggle-onboarding-menu", {
                            detail: { open: false, menuId },
                        }),
                    );
                }
            }

            if (target === ".tour-roster-section") {
                // Preemptively click the Roster Tab button if we are on mobile view
                const rosterTab = document.querySelector(
                    ".tour-mobile-tab-roster",
                );
                if (rosterTab) {
                    rosterTab.click();
                }
            }
        }

        // Preemptively open or close the menu dropdown / tabs during STEP_AFTER transitions to let React
        // flush state changes and render elements in the DOM before the next step's measurement.
        if (type === EVENTS.STEP_AFTER) {
            if (data.action === "next" || data.action === "prev") {
                const nextIndex =
                    data.action === "prev" ? data.index - 1 : data.index + 1;
                const nextStep = activeSteps[nextIndex];
                const nextTarget = nextStep?.target;

                let delay = 0;
                if (typeof nextTarget === "string") {
                    if (menuId) {
                        if (nextTarget.includes("menu-section")) {
                            window.dispatchEvent(
                                new CustomEvent("toggle-onboarding-menu", {
                                    detail: { open: true, menuId },
                                }),
                            );
                            delay = 150; // Give menu time to render
                        } else {
                            window.dispatchEvent(
                                new CustomEvent("toggle-onboarding-menu", {
                                    detail: { open: false, menuId },
                                }),
                            );
                        }
                    }

                    if (nextTarget.includes("tour-roster-section")) {
                        const rosterTab = document.querySelector(
                            ".tour-mobile-tab-roster",
                        );
                        if (rosterTab) {
                            rosterTab.click();
                            delay = 150; // Give tab time to transition and render panel
                        }
                    }
                }

                if (nextStep) {
                    if (delay > 0) {
                        setTimeout(() => {
                            setStepIndex(nextIndex);
                        }, delay);
                    } else {
                        setStepIndex(nextIndex);
                    }
                }
            }
        }

        // Listen to finished/skipped statuses or the absolute tour end event
        const isTourFinished =
            status === STATUS.FINISHED ||
            status === STATUS.SKIPPED ||
            type === EVENTS.TOUR_END;

        if (isTourFinished) {
            // Close the menu when the tour finishes/skips
            if (menuId) {
                window.dispatchEvent(
                    new CustomEvent("toggle-onboarding-menu", {
                        detail: { open: false, menuId },
                    }),
                );
            }

            setRunTour(false);
            setStepIndex(0); // Reset step index back to 0 on tour end
            const updatedTours = {
                ...onboardingTours,
                [tourKey]: true,
            };

            fetcher.submit(
                {
                    _action: "update-user-preferences",
                    userId: user?.$id,
                    onboardingTours: JSON.stringify(updatedTours),
                },
                { method: "post", action: "/settings" },
            );
        }
    };

    return (
        <>
            {runTour && !hasCompleted && (
                <Joyride
                    steps={activeSteps}
                    run={runTour}
                    stepIndex={stepIndex}
                    continuous
                    showSkipButton={true} // Enabled to guarantee Skip button shows in v2/v3 fallback rendering
                    buttons={["back", "skip", "primary"]} // Consolidated button configuration in Joyride v3
                    options={options} // Pass options directly as a prop in Joyride v3
                    styles={styles}
                    onEvent={handleEvent} // Renamed from callback in Joyride v3
                    disableOverlayClose // Prevent accidental dismissals by clicking outside
                    locale={{
                        last: "Got it!",
                        skip: "Skip Guide",
                    }}
                />
            )}
        </>
    );
}
