import { renderHook, act } from "@/utils/test-utils";
import { useTourGlobalClick } from "../useTourGlobalClick";

describe("useTourGlobalClick", () => {
    it("should bind event listeners when runTour is true", () => {
        const addSpy = jest.spyOn(window, "addEventListener");
        const removeSpy = jest.spyOn(window, "removeEventListener");

        const lastProcessedStepRef = { current: -1 };
        const activeSteps = [{ target: ".tour-action-1b", content: "Step" }];

        const { unmount } = renderHook(() =>
            useTourGlobalClick({
                runTour: true,
                stepIndex: 0,
                activeSteps,
                lastProcessedStepRef,
            }),
        );

        expect(addSpy).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            true,
        );
        expect(addSpy).toHaveBeenCalledWith(
            "pointerup",
            expect.any(Function),
            true,
        );
        expect(addSpy).toHaveBeenCalledWith(
            "mouseup",
            expect.any(Function),
            true,
        );

        unmount();
        expect(removeSpy).toHaveBeenCalledWith(
            "click",
            expect.any(Function),
            true,
        );

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it("should trigger next-step event when clicking the target element", () => {
        const nextStepListener = jest.fn();
        window.addEventListener("onboarding-next-step", nextStepListener);

        const targetDiv = document.createElement("div");
        targetDiv.className = "tour-action-1b";
        document.body.appendChild(targetDiv);

        const lastProcessedStepRef = { current: -1 };
        const activeSteps = [{ target: ".tour-action-1b", content: "Step" }];

        renderHook(() =>
            useTourGlobalClick({
                runTour: true,
                stepIndex: 0,
                activeSteps,
                lastProcessedStepRef,
            }),
        );

        // Click the target element
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });

        act(() => {
            targetDiv.dispatchEvent(clickEvent);
        });

        expect(nextStepListener).toHaveBeenCalled();
        expect(lastProcessedStepRef.current).toBe(0);

        window.removeEventListener("onboarding-next-step", nextStepListener);
        document.body.removeChild(targetDiv);
    });
});
