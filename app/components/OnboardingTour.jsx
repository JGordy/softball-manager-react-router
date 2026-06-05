import { useState, useEffect, useRef } from "react";
import { Joyride, STATUS, EVENTS } from "react-joyride";
import { useFetcher } from "react-router";
import { useJoyrideThemeStyles } from "@/hooks/useJoyrideThemeStyles";
import { trackEvent } from "@/utils/analytics";

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
 * @param {string} [props.trackingSuffix] - Optional explicit tracking suffix to use for analytics events (e.g. 'teams', 'events').
 * @returns {React.ReactElement|null} The guided tour or null.
 */
export default function OnboardingTour({
    tourKey,
    steps,
    user,
    menuId,
    alwaysIncludeTargets = [],
    trackingSuffix,
    disableScrolling = false,
}) {
    const [mounted, setMounted] = useState(false);
    const [isDesktopViewport, setIsDesktopViewport] = useState(false);
    const [runTour, setRunTour] = useState(false); // Delayed state to bypass Joyride mounting race conditions
    const [stepIndex, setStepIndex] = useState(0); // Controlled step index to delay transitions and prevent race conditions
    const { options, styles } = useJoyrideThemeStyles();
    const fetcher = useFetcher();
    const tourEndTimeoutRef = useRef(null);
    const selectTimeoutRef = useRef(null);
    const hasSubmittedEndRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            setIsDesktopViewport(
                window.matchMedia("(min-width: 62em)").matches,
            );
        }, 0);
        return () => {
            clearTimeout(timer);
            if (tourEndTimeoutRef.current) {
                clearTimeout(tourEndTimeoutRef.current);
            }
            if (selectTimeoutRef.current) {
                clearTimeout(selectTimeoutRef.current);
            }
        };
    }, []);

    const userPrefs = user?.prefs || {};
    const onboardingTours = userPrefs.onboardingTours || {};
    const hasCompleted = onboardingTours[tourKey] === true;

    // Handle delayed start of the tour on mount to ensure all DOM elements are painted
    useEffect(() => {
        if (mounted && !hasCompleted) {
            hasSubmittedEndRef.current = false;
            const timer = setTimeout(() => {
                setStepIndex(0); // Ensure step index is reset to 0 when launching
                setRunTour(true);
            }, 600); // 600ms delay to let the page settle, layout paint, and prevent first-step Floater bugs
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
                    // because the menu/tab/drawer will be programmatically opened when the step starts.
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
        .map((step) => {
            const resolvedTarget =
                typeof step.target === "function" ? step.target() : step.target;
            return {
                ...step,
                target: resolvedTarget,
                skipBeacon: true,
            };
        });

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
            const resolvedTarget =
                typeof target === "function" ? target() : target;

            // Clear any active select dropdown timeout from a previous step
            if (selectTimeoutRef.current) {
                clearTimeout(selectTimeoutRef.current);
            }

            const isMenuStep =
                menuId &&
                (typeof resolvedTarget === "string"
                    ? resolvedTarget.includes(`tour-${menuId}-section`) ||
                      resolvedTarget.includes(`tour-${menuId}-dropdown`) ||
                      resolvedTarget.includes(`tour-${menuId}-item`)
                    : resolvedTarget instanceof HTMLElement &&
                      (resolvedTarget.matches(
                          `[class*="tour-${menuId}-section"]`,
                      ) ||
                          resolvedTarget.matches(
                              `[class*="tour-${menuId}-dropdown"]`,
                          ) ||
                          resolvedTarget.matches(
                              `[class*="tour-${menuId}-item"]`,
                          ) ||
                          resolvedTarget.closest(
                              `[class*="tour-${menuId}-section"]`,
                          ) !== null ||
                          resolvedTarget.closest(
                              `[class*="tour-${menuId}-dropdown"]`,
                          ) !== null ||
                          resolvedTarget.closest(
                              `[class*="tour-${menuId}-item"]`,
                          ) !== null));

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

            if (
                typeof resolvedTarget === "string" &&
                resolvedTarget.includes("tour-option-")
            ) {
                // Dispatch event to open the lineup drawer automatically during the tour
                window.dispatchEvent(
                    new CustomEvent("toggle-onboarding-lineup-drawer", {
                        detail: { open: true },
                    }),
                );
            }

            if (
                typeof resolvedTarget === "string" &&
                resolvedTarget.includes("tour-roster-section")
            ) {
                // Preemptively click the Roster Tab button if we are on mobile view
                const rosterTab = document.querySelector(
                    ".tour-mobile-tab-roster",
                );
                if (rosterTab) {
                    rosterTab.click();
                }
            }

            if (
                typeof resolvedTarget === "string" &&
                resolvedTarget === "#tour-position-select-0"
            ) {
                // Let the step and overlay settle before opening the select dropdown
                selectTimeoutRef.current = setTimeout(() => {
                    const selectEl = document.querySelector(
                        "#tour-position-select-0",
                    );
                    if (selectEl) {
                        selectEl.focus();
                        selectEl.click();

                        // Mantine's Select is powered by Combobox which toggles on pointerdown events.
                        // Dispatch pointerdown/mousedown and click events to the input and its parent wrapper to trigger the toggle.
                        const wrapper =
                            selectEl.closest(".mantine-Input-wrapper") ||
                            selectEl.parentElement;
                        if (wrapper) {
                            if (typeof PointerEvent !== "undefined") {
                                wrapper.dispatchEvent(
                                    new PointerEvent("pointerdown", {
                                        bubbles: true,
                                        cancelable: true,
                                    }),
                                );
                            } else if (typeof MouseEvent !== "undefined") {
                                wrapper.dispatchEvent(
                                    new MouseEvent("mousedown", {
                                        bubbles: true,
                                        cancelable: true,
                                    }),
                                );
                            }
                            wrapper.click();
                        }
                    }
                }, 200);
            }
        }

        // Preemptively open or close the menu dropdown / tabs during STEP_AFTER transitions to let React
        // flush state changes and render elements in the DOM before the next step's measurement.
        if (type === EVENTS.STEP_AFTER) {
            // Clear any active select dropdown timeout on transition
            if (selectTimeoutRef.current) {
                clearTimeout(selectTimeoutRef.current);
            }

            if (data.action === "next" || data.action === "prev") {
                const nextIndex =
                    data.action === "prev" ? data.index - 1 : data.index + 1;
                const nextStep = activeSteps[nextIndex];
                const nextTarget = nextStep?.target;

                let delay = 0;

                const currentStep = activeSteps[data.index];
                const currentTarget = currentStep?.target;
                const resolvedCurrentTarget =
                    typeof currentTarget === "function"
                        ? currentTarget()
                        : currentTarget;
                const toggleClassName = menuId
                    ? `tour-${menuId}-item-toggle-scoring-mode`
                    : "tour-menu-item-toggle-scoring-mode";

                const isToggleScoringModeStep =
                    typeof resolvedCurrentTarget === "string"
                        ? resolvedCurrentTarget.includes(toggleClassName)
                        : resolvedCurrentTarget instanceof HTMLElement &&
                          (resolvedCurrentTarget.matches(
                              `[class*="${toggleClassName}"]`,
                          ) ||
                              resolvedCurrentTarget.closest(
                                  `[class*="${toggleClassName}"]`,
                              ) !== null);

                if (data.action === "next" && isToggleScoringModeStep) {
                    const toggleBtn = document.querySelector(
                        `.${toggleClassName}`,
                    );
                    if (toggleBtn) {
                        toggleBtn.click();
                        delay = 800;
                    }
                }

                if (nextTarget) {
                    const resolvedNextTarget =
                        typeof nextTarget === "function"
                            ? nextTarget()
                            : nextTarget;
                    const isStringTarget =
                        typeof resolvedNextTarget === "string";

                    const isNextToggleScoringModeStep =
                        typeof resolvedNextTarget === "string"
                            ? resolvedNextTarget.includes(toggleClassName)
                            : resolvedNextTarget instanceof HTMLElement &&
                              (resolvedNextTarget.matches(
                                  `[class*="${toggleClassName}"]`,
                              ) ||
                                  resolvedNextTarget.closest(
                                      `[class*="${toggleClassName}"]`,
                                  ) !== null);

                    if (data.action === "prev" && isNextToggleScoringModeStep) {
                        if (menuId) {
                            window.dispatchEvent(
                                new CustomEvent("toggle-onboarding-menu", {
                                    detail: { open: true, menuId },
                                }),
                            );
                        }
                        setTimeout(() => {
                            const toggleBtn = document.querySelector(
                                `.${toggleClassName}`,
                            );
                            if (toggleBtn) {
                                toggleBtn.click();
                            }
                        }, 100);
                        delay = Math.max(delay, 800);
                    }

                    if (menuId) {
                        const isNextMenuStep =
                            typeof resolvedNextTarget === "string"
                                ? resolvedNextTarget.includes(
                                      `tour-${menuId}-section`,
                                  ) ||
                                  resolvedNextTarget.includes(
                                      `tour-${menuId}-dropdown`,
                                  ) ||
                                  resolvedNextTarget.includes(
                                      `tour-${menuId}-item`,
                                  )
                                : resolvedNextTarget instanceof HTMLElement &&
                                  (resolvedNextTarget.matches(
                                      `[class*="tour-${menuId}-section"]`,
                                  ) ||
                                      resolvedNextTarget.matches(
                                          `[class*="tour-${menuId}-dropdown"]`,
                                      ) ||
                                      resolvedNextTarget.matches(
                                          `[class*="tour-${menuId}-item"]`,
                                      ) ||
                                      resolvedNextTarget.closest(
                                          `[class*="tour-${menuId}-section"]`,
                                      ) !== null ||
                                      resolvedNextTarget.closest(
                                          `[class*="tour-${menuId}-dropdown"]`,
                                      ) !== null ||
                                      resolvedNextTarget.closest(
                                          `[class*="tour-${menuId}-item"]`,
                                      ) !== null);
                        if (isNextMenuStep) {
                            window.dispatchEvent(
                                new CustomEvent("toggle-onboarding-menu", {
                                    detail: { open: true, menuId },
                                }),
                            );
                            delay = Math.max(delay, 150); // Give menu time to render
                        } else if (
                            !isToggleScoringModeStep &&
                            !isNextToggleScoringModeStep
                        ) {
                            window.dispatchEvent(
                                new CustomEvent("toggle-onboarding-menu", {
                                    detail: { open: false, menuId },
                                }),
                            );
                        }
                    }

                    if (
                        isStringTarget &&
                        resolvedNextTarget.includes("tour-option-")
                    ) {
                        window.dispatchEvent(
                            new CustomEvent("toggle-onboarding-lineup-drawer", {
                                detail: { open: true },
                            }),
                        );
                        delay = Math.max(delay, 300); // Give drawer time to slide open and render
                    } else if (
                        isStringTarget &&
                        // If we are transitioning away from a drawer step (e.g. back to start or forward to player chart)
                        // close the drawer.
                        !resolvedNextTarget.includes("tour-option-")
                    ) {
                        window.dispatchEvent(
                            new CustomEvent("toggle-onboarding-lineup-drawer", {
                                detail: { open: false },
                            }),
                        );
                    }

                    if (
                        isStringTarget &&
                        resolvedNextTarget.includes("tour-roster-section")
                    ) {
                        const rosterTab = document.querySelector(
                            ".tour-mobile-tab-roster",
                        );
                        if (rosterTab) {
                            rosterTab.click();
                            delay = Math.max(delay, 150); // Give tab time to transition and render panel
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

        // Handle missing elements gracefully in controlled mode (error:target_not_found)
        if (type === EVENTS.TARGET_NOT_FOUND) {
            const isLastStep = data.index === activeSteps.length - 1;
            if (isLastStep && data.action !== "prev") {
                // Terminate tour if we hit target_not_found on the very last step going forward
                window.dispatchEvent(
                    new CustomEvent("toggle-onboarding-lineup-drawer", {
                        detail: { open: false },
                    }),
                );
                if (menuId) {
                    window.dispatchEvent(
                        new CustomEvent("toggle-onboarding-menu", {
                            detail: { open: false, menuId },
                        }),
                    );
                }
                // Clear any existing tour end timeout
                if (tourEndTimeoutRef.current) {
                    clearTimeout(tourEndTimeoutRef.current);
                }

                // Use a short delay before unmounting the Joyride component to allow its
                // internal portal overlay clean-up logic to execute and cleanly remove itself from the DOM
                tourEndTimeoutRef.current = setTimeout(() => {
                    setRunTour(false);
                    setStepIndex(0);
                }, 100);
                const updatedTours = {
                    ...onboardingTours,
                    [tourKey]: true,
                };
                if (user?.$id) {
                    fetcher.submit(
                        {
                            _action: "update-user-preferences",
                            userId: user.$id,
                            onboardingTours: JSON.stringify(updatedTours),
                        },
                        { method: "post", action: "/api/user-preferences" },
                    );
                }
            } else {
                // Adjust index based on navigation direction (action 'prev' vs 'next') and clamp between 0 and activeSteps length
                const nextIndex =
                    data.action === "prev" ? data.index - 1 : data.index + 1;
                const clampedIndex = Math.max(
                    0,
                    Math.min(activeSteps.length - 1, nextIndex),
                );
                setStepIndex(clampedIndex);
            }
            return;
        }

        // Handle finished/skipped statuses, absolute tour end event, or the last step next action in controlled mode
        const isTourFinished =
            status === STATUS.FINISHED ||
            status === STATUS.SKIPPED ||
            type === EVENTS.TOUR_END ||
            (type === EVENTS.STEP_AFTER &&
                data.action === "next" &&
                data.index === activeSteps.length - 1);

        if (isTourFinished) {
            if (hasSubmittedEndRef.current) return;
            hasSubmittedEndRef.current = true;
            // Track tour metrics using the snake_case naming style chosen for these onboarding events.
            // Dynamically scope event names by using the provided trackingSuffix, or parsing the tourKey.
            const isSkipped =
                status === STATUS.SKIPPED || data.action === "skip";

            const suffix = trackingSuffix
                ? trackingSuffix.startsWith("_")
                    ? trackingSuffix
                    : `_${trackingSuffix}`
                : tourKey
                  ? `_${tourKey.split("_")[0]}s`
                  : "";

            const eventName = isSkipped
                ? `onboarding_tour_skipped${suffix}`
                : `onboarding_tour_completed${suffix}`;

            trackEvent(eventName, {
                tourKey,
                userId: user?.$id || "anonymous",
                lastStep: data.index,
            });

            // Close the menu and lineup drawer when the tour finishes/skips
            window.dispatchEvent(
                new CustomEvent("toggle-onboarding-lineup-drawer", {
                    detail: { open: false },
                }),
            );

            if (menuId) {
                window.dispatchEvent(
                    new CustomEvent("toggle-onboarding-menu", {
                        detail: { open: false, menuId },
                    }),
                );
            }

            // Clear any existing tour end timeout
            if (tourEndTimeoutRef.current) {
                clearTimeout(tourEndTimeoutRef.current);
            }

            // Use a short delay before unmounting the Joyride component to allow its
            // internal portal overlay clean-up logic to execute and cleanly remove itself from the DOM
            tourEndTimeoutRef.current = setTimeout(() => {
                setRunTour(false);
                setStepIndex(0); // Reset step index back to 0 on tour end
            }, 100);

            const updatedTours = {
                ...onboardingTours,
                [tourKey]: true,
            };

            if (user?.$id) {
                fetcher.submit(
                    {
                        _action: "update-user-preferences",
                        userId: user.$id,
                        onboardingTours: JSON.stringify(updatedTours),
                    },
                    { method: "post", action: "/api/user-preferences" },
                );
            }
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
                    options={{
                        ...options,
                        skipScroll: disableScrolling,
                        buttons: ["back", "skip", "primary"],
                        overlayClickAction: false, // Prevent clicking outside the tooltip on the overlay from closing it and locking the screen
                    }}
                    styles={styles}
                    onEvent={handleEvent} // Renamed from callback in Joyride v3
                    locale={{
                        last: "Got it!",
                        skip: "Skip Guide",
                        next: "Next",
                        back: "Back",
                    }}
                />
            )}
        </>
    );
}
