import { STATUS, EVENTS } from "react-joyride";
import { trackEvent } from "@/utils/analytics";

// Helper utilities to decouple DOM queries and custom event dispatching (DRY)

/**
 * Resolves a Joyride step target which can be a function returning a selector/element, or the selector itself.
 */
const resolveTarget = (target) =>
    typeof target === "function" ? target() : target;

/**
 * Dispatches the custom toggle-onboarding-menu event.
 */
const dispatchToggleMenu = (menuId, open) => {
    if (menuId) {
        window.dispatchEvent(
            new CustomEvent("toggle-onboarding-menu", {
                detail: { open, menuId },
            }),
        );
    }
};

/**
 * Dispatches the custom toggle-onboarding-lineup-drawer event.
 */
const dispatchToggleDrawer = (open) => {
    window.dispatchEvent(
        new CustomEvent("toggle-onboarding-lineup-drawer", {
            detail: { open },
        }),
    );
};

/**
 * Safely clicks an element matching the query selector if it exists.
 */
const clickElement = (selector) => {
    const el = document.querySelector(selector);
    if (el) {
        el.click();
        return true;
    }
    return false;
};

/**
 * Checks if the resolved target matches menu related selectors.
 */
const checkIsMenuStep = (resolvedTarget, menuId) => {
    if (!menuId || !resolvedTarget) return false;
    if (typeof resolvedTarget === "string") {
        return (
            resolvedTarget.includes(`tour-${menuId}-section`) ||
            resolvedTarget.includes(`tour-${menuId}-dropdown`) ||
            resolvedTarget.includes(`tour-${menuId}-item`)
        );
    }
    if (resolvedTarget instanceof HTMLElement) {
        return (
            resolvedTarget.matches(`[class*="tour-${menuId}-section"]`) ||
            resolvedTarget.matches(`[class*="tour-${menuId}-dropdown"]`) ||
            resolvedTarget.matches(`[class*="tour-${menuId}-item"]`) ||
            resolvedTarget.closest(`[class*="tour-${menuId}-section"]`) !==
                null ||
            resolvedTarget.closest(`[class*="tour-${menuId}-dropdown"]`) !==
                null ||
            resolvedTarget.closest(`[class*="tour-${menuId}-item"]`) !== null
        );
    }
    return false;
};

/**
 * Custom hook that returns the Joyride onEvent handler function.
 * This abstracts step transitions, tab/drawer/menu interactions, target_not_found errors,
 * and tour completion analytics & persistence.
 */
export function useTourEventHandler({
    tourKey,
    activeSteps,
    user,
    menuId,
    trackingSuffix,
    onboardingTours,
    setStepIndex,
    setRunTour,
    setRerenderCount,
    fetcher,
    tourEndTimeoutRef,
    selectTimeoutRef,
    hasSubmittedEndRef,
}) {
    return (data) => {
        const { status, type, step } = data;

        // Programmatically open/close menu dropdowns and tab panels during step transitions
        if (type === EVENTS.STEP_BEFORE) {
            const resolvedTarget = resolveTarget(step?.target);

            // Clear any active select dropdown timeout from a previous step
            if (selectTimeoutRef.current) {
                clearTimeout(selectTimeoutRef.current);
            }

            const isMenuStep = checkIsMenuStep(resolvedTarget, menuId);
            if (menuId) {
                dispatchToggleMenu(menuId, isMenuStep);
            }

            if (
                typeof resolvedTarget === "string" &&
                resolvedTarget.includes("tour-option-")
            ) {
                dispatchToggleDrawer(true);
            }

            if (
                typeof resolvedTarget === "string" &&
                resolvedTarget.includes("tour-roster-section")
            ) {
                clickElement(".tour-mobile-tab-roster");
            }

            if (
                typeof resolvedTarget === "string" &&
                resolvedTarget === "#tour-position-select-0"
            ) {
                selectTimeoutRef.current = setTimeout(() => {
                    const selectEl = document.querySelector(
                        "#tour-position-select-0",
                    );
                    if (selectEl) {
                        selectEl.focus();
                        selectEl.click();

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
                const resolvedCurrentTarget = resolveTarget(
                    currentStep?.target,
                );
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
                    if (clickElement(`.${toggleClassName}`)) {
                        delay = 800;
                    }
                }

                const is1BStep =
                    typeof resolvedCurrentTarget === "string" &&
                    resolvedCurrentTarget.includes("tour-action-1b");

                if (data.action === "next" && is1BStep) {
                    if (clickElement(".tour-action-1b")) {
                        delay = 650;
                    }
                }

                const isSprayFieldStep =
                    typeof resolvedCurrentTarget === "string" &&
                    resolvedCurrentTarget.includes("tour-spray-field");

                if (data.action === "next" && isSprayFieldStep) {
                    clickElement(".tour-field-position-rf");
                    if (clickElement(".tour-proceed-advancement-btn")) {
                        delay = 450;
                    } else {
                        delay = 350;
                    }
                }

                const isConfirmPlayStep =
                    typeof resolvedCurrentTarget === "string" &&
                    resolvedCurrentTarget.includes("tour-confirm-play-btn");

                if (data.action === "next" && isConfirmPlayStep) {
                    if (clickElement(".tour-confirm-play-btn")) {
                        delay = 3000;
                    }
                }

                const isUndoPlayStep =
                    typeof resolvedCurrentTarget === "string" &&
                    resolvedCurrentTarget.includes("tour-last-play-card");

                if (data.action === "next" && isUndoPlayStep) {
                    if (clickElement(".tour-undo-play-btn")) {
                        delay = 850;
                    }
                }

                if (nextTarget) {
                    const resolvedNextTarget = resolveTarget(nextTarget);
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
                        dispatchToggleMenu(menuId, true);
                        setTimeout(() => {
                            clickElement(`.${toggleClassName}`);
                        }, 100);
                        delay = Math.max(delay, 800);
                    }

                    if (menuId) {
                        const isNextMenuStep = checkIsMenuStep(
                            resolvedNextTarget,
                            menuId,
                        );
                        if (isNextMenuStep) {
                            dispatchToggleMenu(menuId, true);
                            delay = Math.max(delay, 150);
                        } else if (
                            !isToggleScoringModeStep &&
                            !isNextToggleScoringModeStep
                        ) {
                            dispatchToggleMenu(menuId, false);
                        }
                    }

                    if (
                        isStringTarget &&
                        resolvedNextTarget.includes("tour-option-")
                    ) {
                        dispatchToggleDrawer(true);
                        delay = Math.max(delay, 300);
                    } else if (
                        isStringTarget &&
                        !resolvedNextTarget.includes("tour-option-")
                    ) {
                        dispatchToggleDrawer(false);
                    }

                    if (
                        isStringTarget &&
                        resolvedNextTarget.includes("tour-roster-section")
                    ) {
                        if (clickElement(".tour-mobile-tab-roster")) {
                            delay = Math.max(delay, 150);
                        }
                    }

                    if (
                        isStringTarget &&
                        (resolvedNextTarget.includes("tour-action-1b") ||
                            resolvedNextTarget.includes("tour-last-play-card"))
                    ) {
                        if (clickElement('button[role="tab"][value="live"]')) {
                            delay = Math.max(delay, 150);
                        }
                    }

                    if (
                        isStringTarget &&
                        resolvedNextTarget.includes("tour-action-1b") &&
                        data.action === "prev"
                    ) {
                        const closeBtn =
                            document.querySelector(
                                '[class*="mantine-Drawer-close"]',
                            ) ||
                            document.querySelector(
                                '[aria-label="Close drawer"]',
                            ) ||
                            document.querySelector('button[color="gray"]');
                        if (closeBtn) {
                            closeBtn.click();
                        }
                        delay = Math.max(delay, 300);
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

        // Handle missing elements gracefully in controlled mode
        if (type === EVENTS.TARGET_NOT_FOUND) {
            const isLastStep = data.index === activeSteps.length - 1;
            if (isLastStep && data.action !== "prev") {
                if (step?.target === ".tour-last-play-card") {
                    const interval = setInterval(() => {
                        const el = document.querySelector(
                            ".tour-last-play-card",
                        );
                        if (el) {
                            clearInterval(interval);
                            setRerenderCount((c) => c + 1);
                        }
                    }, 200);
                    return;
                }
                dispatchToggleDrawer(false);
                dispatchToggleMenu(menuId, false);

                if (tourEndTimeoutRef.current) {
                    clearTimeout(tourEndTimeoutRef.current);
                }

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

        // Handle finished/skipped statuses
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

            dispatchToggleDrawer(false);
            dispatchToggleMenu(menuId, false);

            if (tourEndTimeoutRef.current) {
                clearTimeout(tourEndTimeoutRef.current);
            }

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
        }
    };
}
