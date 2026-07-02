import { renderHook, act } from "@/utils/test-utils";
import { useTourCustomNavigation } from "../useTourCustomNavigation";

describe("useTourCustomNavigation", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should advance stepIndex when next-step custom event is fired", () => {
        const setStepIndex = jest.fn();
        const activeSteps = [
            { target: ".normal-target", content: "Step 1" },
            { target: ".other-target", content: "Step 2" },
        ];

        renderHook(() =>
            useTourCustomNavigation({
                runTour: true,
                stepIndex: 0,
                activeSteps,
                setStepIndex,
            }),
        );

        act(() => {
            window.dispatchEvent(new CustomEvent("onboarding-next-step"));
        });

        // No delay on normal target, advances immediately
        expect(setStepIndex).toHaveBeenCalled();
    });

    it("should respect delay on specific target elements", () => {
        const setStepIndex = jest.fn();
        const activeSteps = [
            { target: ".tour-confirm-play-btn", content: "Confirm Step" },
            { target: ".other-target", content: "Step 2" },
        ];

        renderHook(() =>
            useTourCustomNavigation({
                runTour: true,
                stepIndex: 0,
                activeSteps,
                setStepIndex,
            }),
        );

        act(() => {
            window.dispatchEvent(new CustomEvent("onboarding-next-step"));
        });

        // 3000ms delay for confirm play button
        expect(setStepIndex).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(2999);
        });
        expect(setStepIndex).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(setStepIndex).toHaveBeenCalled();
    });

    it("should clear timeout on unmount to prevent leaks", () => {
        const setStepIndex = jest.fn();
        const activeSteps = [
            { target: ".tour-confirm-play-btn", content: "Confirm Step" },
            { target: ".other-target", content: "Step 2" },
        ];

        const { unmount } = renderHook(() =>
            useTourCustomNavigation({
                runTour: true,
                stepIndex: 0,
                activeSteps,
                setStepIndex,
            }),
        );

        act(() => {
            window.dispatchEvent(new CustomEvent("onboarding-next-step"));
        });

        // Timeout is scheduled, unmount hook now
        unmount();

        act(() => {
            jest.advanceTimersByTime(3500);
        });

        expect(setStepIndex).not.toHaveBeenCalled();
    });
});
