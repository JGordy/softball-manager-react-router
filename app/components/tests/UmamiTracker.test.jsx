import { render, act } from "@testing-library/react";
import { useLocation, useMatches } from "react-router";
import { UmamiTracker } from "../UmamiTracker";

// Mock react-router hooks
jest.mock("react-router", () => ({
    useLocation: jest.fn(),
    useMatches: jest.fn(),
}));

describe("UmamiTracker", () => {
    let originalUmami;
    let mockTrack;

    beforeEach(() => {
        originalUmami = window.umami;
        mockTrack = jest.fn();
        window.umami = { track: mockTrack };

        useLocation.mockReturnValue({ pathname: "/test" });
        useMatches.mockReturnValue([]);

        jest.useFakeTimers();
    });

    afterEach(() => {
        if (typeof originalUmami === "undefined") {
            delete window.umami;
        } else {
            window.umami = originalUmami;
        }
        jest.useRealTimers();
        jest.restoreAllMocks(); // This likely covers mockRestores too, checking doc later
    });

    it("tracks page view on mount", () => {
        render(<UmamiTracker />);
        expect(mockTrack).toHaveBeenCalledWith({ url: "/test" });
    });

    it("replaces route params with generic values and sends metadata", () => {
        useLocation.mockReturnValue({ pathname: "/team/123/events/456" });
        useMatches.mockReturnValue([
            { params: { teamId: "123", eventId: "456" } },
        ]);

        render(<UmamiTracker />);

        // Expected URL: /team/:teamId/events/:eventId
        expect(mockTrack).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "/team/:teamId/events/:eventId",
                teamId: "123",
                eventId: "456",
            }),
        );
    });

    it("fires specific events for high-value entities", () => {
        useLocation.mockReturnValue({ pathname: "/team/123" });
        useMatches.mockReturnValue([{ params: { teamId: "123" } }]);

        render(<UmamiTracker />);

        expect(mockTrack).toHaveBeenCalledWith("view_team", { teamId: "123" });
    });

    it("fires view_season events", () => {
        useLocation.mockReturnValue({ pathname: "/season/s1" });
        useMatches.mockReturnValue([{ params: { seasonId: "s1" } }]);

        render(<UmamiTracker />);

        expect(mockTrack).toHaveBeenCalledWith("view_season", {
            seasonId: "s1",
        });
    });

    it("retries if umami is not available initially", () => {
        // Remove umami globally
        delete window.umami;

        render(<UmamiTracker />);
        expect(mockTrack).not.toHaveBeenCalled();

        // Add umami back
        window.umami = { track: mockTrack };

        // Fast-forward time
        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(mockTrack).toHaveBeenCalledWith({ url: "/test" });
    });

    it("cleans up interval on unmount", () => {
        delete window.umami;
        const clearIntervalSpy = jest.spyOn(global, "clearInterval");

        const { unmount } = render(<UmamiTracker />);

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
    });
});
