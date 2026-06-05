import { renderHook } from "@/utils/test-utils";
import { createTourEventHandler } from "../createTourEventHandler";
import { STATUS, EVENTS } from "react-joyride";
import { trackEvent } from "@/utils/analytics";

// Mock analytics tracker
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("createTourEventHandler", () => {
    let props;
    let windowEventSpy;

    let simulatedRefs;

    beforeEach(() => {
        jest.clearAllMocks();
        windowEventSpy = jest.spyOn(window, "dispatchEvent");
        simulatedRefs = {
            tourEndTimeout: null,
            selectTimeout: null,
            hasSubmittedEnd: false,
            pollingInterval: null,
        };

        props = {
            tourKey: "test_tour",
            activeSteps: [
                { target: ".tour-action-1b", content: "Step 1" },
                { target: ".tour-confirm-play-btn", content: "Step 2" },
            ],
            user: { $id: "user-123", prefs: { onboardingTours: {} } },
            menuId: "menu-abc",
            trackingSuffix: "test",
            onboardingTours: {},
            setStepIndex: jest.fn(),
            setRunTour: jest.fn(),
            setRerenderCount: jest.fn(),
            fetcher: { submit: jest.fn() },
            clearTourEndTimeout: jest.fn(() => {
                if (simulatedRefs.tourEndTimeout) {
                    clearTimeout(simulatedRefs.tourEndTimeout);
                    simulatedRefs.tourEndTimeout = null;
                }
            }),
            setTourEndTimeout: jest.fn((val) => {
                simulatedRefs.tourEndTimeout = val;
            }),
            clearSelectTimeout: jest.fn(() => {
                if (simulatedRefs.selectTimeout) {
                    clearTimeout(simulatedRefs.selectTimeout);
                    simulatedRefs.selectTimeout = null;
                }
            }),
            setSelectTimeout: jest.fn((val) => {
                simulatedRefs.selectTimeout = val;
            }),
            getHasSubmittedEnd: jest.fn(() => simulatedRefs.hasSubmittedEnd),
            setHasSubmittedEnd: jest.fn((val) => {
                simulatedRefs.hasSubmittedEnd = val;
            }),
            clearPollingInterval: jest.fn(() => {
                if (simulatedRefs.pollingInterval) {
                    clearInterval(simulatedRefs.pollingInterval);
                    simulatedRefs.pollingInterval = null;
                }
            }),
            setPollingInterval: jest.fn((val) => {
                simulatedRefs.pollingInterval = val;
            }),
            getPollingInterval: jest.fn(() => simulatedRefs.pollingInterval),
        };
    });

    afterEach(() => {
        windowEventSpy.mockRestore();
    });

    it("returns a function to handle Joyride events", () => {
        const { result } = renderHook(() => createTourEventHandler(props));
        expect(typeof result.current).toBe("function");
    });

    it("handles STEP_BEFORE events for drawer/menu targets", () => {
        const { result } = renderHook(() => createTourEventHandler(props));
        const handleEvent = result.current;

        // Menu Step
        handleEvent({
            type: EVENTS.STEP_BEFORE,
            step: { target: "tour-menu-abc-section" },
        });
        expect(windowEventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "toggle-onboarding-menu",
                detail: { open: true, menuId: "menu-abc" },
            }),
        );

        // Lineup drawer step
        handleEvent({
            type: EVENTS.STEP_BEFORE,
            step: { target: "tour-option-list" },
        });
        expect(windowEventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "toggle-onboarding-lineup-drawer",
                detail: { open: true },
            }),
        );
    });

    it("handles STEP_AFTER custom programmatic navigation actions", () => {
        const { result } = renderHook(() => createTourEventHandler(props));
        const handleEvent = result.current;

        const actionBtn = document.createElement("button");
        actionBtn.className = "tour-action-1b";
        document.body.appendChild(actionBtn);

        const clickSpy = jest.spyOn(actionBtn, "click");

        handleEvent({
            type: EVENTS.STEP_AFTER,
            index: 0,
            action: "next",
        });

        expect(clickSpy).toHaveBeenCalled();

        clickSpy.mockRestore();
        document.body.removeChild(actionBtn);
    });

    it("triggers analytics and saves completion on finished status", () => {
        const { result } = renderHook(() => createTourEventHandler(props));
        const handleEvent = result.current;

        jest.useFakeTimers();

        handleEvent({
            status: STATUS.FINISHED,
            type: EVENTS.TOUR_END,
            index: 1,
            step: props.activeSteps[1],
        });

        // Verifies event tracking
        expect(trackEvent).toHaveBeenCalledWith(
            "onboarding_tour_completed_test",
            expect.objectContaining({
                tourKey: "test_tour",
                userId: "user-123",
                lastStep: 1,
            }),
        );

        // Verifies user preferences persistence via fetcher
        expect(props.fetcher.submit).toHaveBeenCalledWith(
            expect.objectContaining({
                _action: "update-user-preferences",
                userId: "user-123",
                onboardingTours: JSON.stringify({ test_tour: true }),
            }),
            expect.objectContaining({
                method: "post",
                action: "/api/user-preferences",
            }),
        );

        jest.runAllTimers();
        expect(props.setRunTour).toHaveBeenCalledWith(false);
        expect(props.setStepIndex).toHaveBeenCalledWith(0);

        jest.useRealTimers();
    });

    it("polls for .tour-last-play-card on target not found at last step and completes if retries exceed max", () => {
        props.activeSteps = [
            { target: ".tour-last-play-card", content: "Last step" },
        ];
        const { result } = renderHook(() => createTourEventHandler(props));
        const handleEvent = result.current;

        jest.useFakeTimers();

        handleEvent({
            type: EVENTS.TARGET_NOT_FOUND,
            index: 0,
            action: "next",
            step: props.activeSteps[0],
        });

        // Interval should be set
        expect(props.getPollingInterval()).not.toBeNull();

        // Advance timers past maxRetries (15 * 200ms = 3000ms)
        jest.advanceTimersByTime(3200);

        // It should clear interval and call cleanupAndFinishTour
        expect(props.getPollingInterval()).toBeNull();
        expect(props.setRunTour).toHaveBeenCalledWith(false);
        expect(props.setStepIndex).toHaveBeenCalledWith(0);

        jest.useRealTimers();
    });

    it("handles TARGET_NOT_FOUND gracefully and clamps the step index", () => {
        const { result } = renderHook(() => createTourEventHandler(props));
        const handleEvent = result.current;

        handleEvent({
            type: EVENTS.TARGET_NOT_FOUND,
            index: 1,
            action: "prev",
            step: props.activeSteps[1],
        });

        expect(props.setStepIndex).toHaveBeenCalledWith(0);
    });
});
