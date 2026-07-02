import { useState, useEffect, useRef } from "react";
import { Joyride } from "react-joyride";
import { useFetcher } from "react-router";

import { useJoyrideThemeStyles } from "@/hooks/useJoyrideThemeStyles";

import { useTourStartDelay } from "./hooks/useTourStartDelay";
import { useTourGlobalClick } from "./hooks/useTourGlobalClick";
import { useTourCustomNavigation } from "./hooks/useTourCustomNavigation";
import { createTourEventHandler } from "./hooks/createTourEventHandler";

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
    const pollingIntervalRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    const hasSubmittedEndRef = useRef(false);
    const lastProcessedStepRef = useRef(-1);

    useEffect(() => {
        lastProcessedStepRef.current = -1;
    }, [stepIndex]);

    const userPrefs = user?.prefs || {};
    const onboardingTours = userPrefs.onboardingTours || {};
    const hasCompleted = onboardingTours[tourKey] === true;

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
            let resolvedTarget = step.target;
            if (typeof step.target === "function") {
                try {
                    const res = step.target();
                    if (typeof res === "string") {
                        resolvedTarget = res;
                    }
                } catch (err) {
                    console.error("Error resolving step target function:", err);
                }
            }
            return {
                ...step,
                target: resolvedTarget,
                skipBeacon: true,
            };
        });

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
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    // Handle delayed start of the tour on mount to ensure all DOM elements are painted
    useTourStartDelay({
        mounted,
        hasCompleted,
        setStepIndex,
        setRunTour,
        hasSubmittedEndRef,
    });

    const [rerenderCount, setRerenderCount] = useState(0);

    // Global listener for interactive clicks to trigger transitions
    useTourGlobalClick({
        runTour,
        stepIndex,
        activeSteps,
        lastProcessedStepRef,
    });

    // Custom next step dispatch events
    useTourCustomNavigation({
        runTour,
        stepIndex,
        activeSteps,
        setStepIndex,
    });

    if (!mounted) return null;
    if (activeSteps.length === 0) return null;

    const handleEvent = createTourEventHandler({
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
        clearTourEndTimeout: () => {
            if (tourEndTimeoutRef.current) {
                clearTimeout(tourEndTimeoutRef.current);
                tourEndTimeoutRef.current = null;
            }
        },
        setTourEndTimeout: (val) => {
            tourEndTimeoutRef.current = val;
        },
        clearSelectTimeout: () => {
            if (selectTimeoutRef.current) {
                clearTimeout(selectTimeoutRef.current);
                selectTimeoutRef.current = null;
            }
        },
        setSelectTimeout: (val) => {
            selectTimeoutRef.current = val;
        },
        clearTransitionTimeout: () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
                transitionTimeoutRef.current = null;
            }
        },
        setTransitionTimeout: (val) => {
            transitionTimeoutRef.current = val;
        },
        getHasSubmittedEnd: () => hasSubmittedEndRef.current,
        setHasSubmittedEnd: (val) => {
            hasSubmittedEndRef.current = val;
        },
        clearPollingInterval: () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        },
        setPollingInterval: (val) => {
            pollingIntervalRef.current = val;
        },
        getPollingInterval: () => pollingIntervalRef.current,
        getLastProcessedStep: () => lastProcessedStepRef.current,
    });

    return (
        <>
            {runTour && !hasCompleted && (
                <Joyride
                    steps={activeSteps.map((s) => ({
                        ...s,
                        _rerender: rerenderCount,
                    }))}
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
