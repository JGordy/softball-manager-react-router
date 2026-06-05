import { renderHook, act } from "@/utils/test-utils";
import { useTourStartDelay } from "../useTourStartDelay";

describe("useTourStartDelay", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should start the tour after delay if mounted and not completed", () => {
        const setStepIndex = jest.fn();
        const setRunTour = jest.fn();
        const hasSubmittedEndRef = { current: true };

        renderHook(() =>
            useTourStartDelay({
                mounted: true,
                hasCompleted: false,
                setStepIndex,
                setRunTour,
                hasSubmittedEndRef,
            }),
        );

        expect(hasSubmittedEndRef.current).toBe(false);
        expect(setStepIndex).not.toHaveBeenCalled();
        expect(setRunTour).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(600);
        });

        expect(setStepIndex).toHaveBeenCalledWith(0);
        expect(setRunTour).toHaveBeenCalledWith(true);
    });

    it("should disable the tour if completed or not mounted", () => {
        const setStepIndex = jest.fn();
        const setRunTour = jest.fn();

        renderHook(() =>
            useTourStartDelay({
                mounted: false,
                hasCompleted: false,
                setStepIndex,
                setRunTour,
            }),
        );

        expect(setRunTour).toHaveBeenCalledWith(false);
    });
});
