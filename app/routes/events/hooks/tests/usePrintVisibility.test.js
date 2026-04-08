import { renderHook } from "@testing-library/react";
import { usePrintVisibility } from "../usePrintVisibility";

describe("usePrintVisibility", () => {
    let mockAddEventListener;
    let mockRemoveEventListener;
    let mockQuerySelector;

    beforeEach(() => {
        mockAddEventListener = jest.spyOn(window, "addEventListener");
        mockRemoveEventListener = jest.spyOn(window, "removeEventListener");
        mockQuerySelector = jest.spyOn(document, "querySelector");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should set up listeners and clean up on unmount", () => {
        const { unmount } = renderHook(() => usePrintVisibility());

        expect(mockAddEventListener).toHaveBeenCalledWith(
            "beforeprint",
            expect.any(Function),
        );
        expect(mockAddEventListener).toHaveBeenCalledWith(
            "afterprint",
            expect.any(Function),
        );

        unmount();

        expect(mockRemoveEventListener).toHaveBeenCalledWith(
            "beforeprint",
            expect.any(Function),
        );
        expect(mockRemoveEventListener).toHaveBeenCalledWith(
            "afterprint",
            expect.any(Function),
        );
    });

    it("should show element on beforeprint and restore on afterprint", () => {
        const mockSetProperty = jest.fn();
        const mockRemoveProperty = jest.fn();
        const mockElement = {
            style: {
                setProperty: mockSetProperty,
                removeProperty: mockRemoveProperty,
            },
        };

        mockQuerySelector.mockReturnValue(mockElement);
        renderHook(() => usePrintVisibility());

        // Extract and call the listeners
        const beforePrint = mockAddEventListener.mock.calls.find(
            (call) => call[0] === "beforeprint",
        )[1];
        const afterPrint = mockAddEventListener.mock.calls.find(
            (call) => call[0] === "afterprint",
        )[1];

        beforePrint();
        expect(mockQuerySelector).toHaveBeenCalledWith("[data-desktop-view]");
        expect(mockSetProperty).toHaveBeenCalledWith(
            "display",
            "block",
            "important",
        );

        afterPrint();
        expect(mockQuerySelector).toHaveBeenCalledWith("[data-desktop-view]");
        expect(mockRemoveProperty).toHaveBeenCalledWith("display");
    });
});
