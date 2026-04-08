import { renderHook, waitFor } from "@testing-library/react";
import { useAvailabilityPrompt } from "../useAvailabilityPrompt";

describe("useAvailabilityPrompt", () => {
    const mockOnOpen = jest.fn();
    const currentUserId = "user123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should open the prompt if user attendance is unknown", async () => {
        const hasPromptedRef = { current: false };
        const attendancePromise = Promise.resolve({
            rows: [{ playerId: "user123", status: "unknown" }],
        });

        renderHook(() =>
            useAvailabilityPrompt({
                deferredData: { attendance: attendancePromise },
                hasPromptedRef,
                currentUserId,
                onOpen: mockOnOpen,
            }),
        );

        await waitFor(() => expect(mockOnOpen).toHaveBeenCalledTimes(1));
        expect(hasPromptedRef.current).toBe(true);
    });

    it("should open the prompt if user is missing from attendance", async () => {
        const hasPromptedRef = { current: false };
        const attendancePromise = Promise.resolve({
            rows: [{ playerId: "otherUser", status: "accepted" }],
        });

        renderHook(() =>
            useAvailabilityPrompt({
                deferredData: { attendance: attendancePromise },
                hasPromptedRef,
                currentUserId,
                onOpen: mockOnOpen,
            }),
        );

        await waitFor(() => expect(mockOnOpen).toHaveBeenCalledTimes(1));
        expect(hasPromptedRef.current).toBe(true);
    });

    it("should NOT open if user is already accepted", async () => {
        const hasPromptedRef = { current: false };
        const attendancePromise = Promise.resolve({
            rows: [{ playerId: "user123", status: "accepted" }],
        });

        renderHook(() =>
            useAvailabilityPrompt({
                deferredData: { attendance: attendancePromise },
                hasPromptedRef,
                currentUserId,
                onOpen: mockOnOpen,
            }),
        );

        // Await the promise to ensure logic has had time to run
        await attendancePromise;
        // Wait a microtask to be sure
        await new Promise((r) => setTimeout(r, 0));

        expect(mockOnOpen).not.toHaveBeenCalled();
        expect(hasPromptedRef.current).toBe(false);
    });

    it("should NOT open if hasPromptedRef is already true", async () => {
        const hasPromptedRef = { current: true };
        const attendancePromise = Promise.resolve({
            rows: [{ playerId: "user123", status: "unknown" }],
        });

        renderHook(() =>
            useAvailabilityPrompt({
                deferredData: { attendance: attendancePromise },
                hasPromptedRef,
                currentUserId,
                onOpen: mockOnOpen,
            }),
        );

        await attendancePromise;
        expect(mockOnOpen).not.toHaveBeenCalled();
    });

    it("should NOT open if gameDeleted is true", async () => {
        const hasPromptedRef = { current: false };
        const attendancePromise = Promise.resolve({
            rows: [{ playerId: "user123", status: "unknown" }],
        });

        renderHook(() =>
            useAvailabilityPrompt({
                deferredData: { attendance: attendancePromise },
                hasPromptedRef,
                currentUserId,
                onOpen: mockOnOpen,
                gameDeleted: true,
            }),
        );

        await attendancePromise;
        expect(mockOnOpen).not.toHaveBeenCalled();
    });
});
