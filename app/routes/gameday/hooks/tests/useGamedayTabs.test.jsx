import { useLocation, useNavigate } from "react-router";
import { renderHook, act } from "@testing-library/react";

import { useGamedayTabs } from "../useGamedayTabs";

jest.mock("react-router", () => ({
    useLocation: jest.fn(),
    useNavigate: jest.fn(),
}));

describe("useGamedayTabs", () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it("initializes to 'live' by default for mobile", () => {
        useLocation.mockReturnValue({
            hash: "",
            pathname: "/game",
            search: "",
        });
        const { result } = renderHook(() =>
            useGamedayTabs({ isDesktop: false }),
        );
        expect(result.current.activeTab).toBe("live");
    });

    it("initializes to 'boxscore' by default for desktop", () => {
        useLocation.mockReturnValue({
            hash: "",
            pathname: "/game",
            search: "",
        });
        const { result } = renderHook(() =>
            useGamedayTabs({ isDesktop: true }),
        );
        expect(result.current.activeTab).toBe("boxscore");
    });

    it("initializes to 'plays' if game is final", () => {
        useLocation.mockReturnValue({
            hash: "",
            pathname: "/game",
            search: "",
        });
        const { result } = renderHook(() =>
            useGamedayTabs({ gameFinal: true }),
        );
        expect(result.current.activeTab).toBe("plays");
    });

    it("uses hash from URL if valid", () => {
        useLocation.mockReturnValue({
            hash: "#spray",
            pathname: "/game",
            search: "",
        });
        const { result } = renderHook(() =>
            useGamedayTabs({ isDesktop: false }),
        );
        expect(result.current.activeTab).toBe("spray");
    });

    it("normalizes 'live' to 'boxscore' on desktop from hash", () => {
        useLocation.mockReturnValue({
            hash: "#live",
            pathname: "/game",
            search: "",
        });
        const { result } = renderHook(() =>
            useGamedayTabs({ isDesktop: true }),
        );
        expect(result.current.activeTab).toBe("boxscore");
    });

    it("updates tab and navigates on handleTabChange", () => {
        useLocation.mockReturnValue({
            hash: "",
            pathname: "/game",
            search: "",
        });
        const { result } = renderHook(() =>
            useGamedayTabs({ isDesktop: false }),
        );

        act(() => {
            result.current.handleTabChange("plays");
        });

        expect(result.current.activeTab).toBe("plays");
        expect(mockNavigate).toHaveBeenCalledWith("/game#plays", {
            replace: false,
        });
    });

    it("syncs with gameFinal status when it changes", () => {
        useLocation.mockReturnValue({
            hash: "",
            pathname: "/game",
            search: "",
        });
        const { result, rerender } = renderHook(
            ({ gameFinal }) => useGamedayTabs({ gameFinal }),
            { initialProps: { gameFinal: false } },
        );

        expect(result.current.activeTab).toBe("live");

        rerender({ gameFinal: true });

        expect(result.current.activeTab).toBe("plays");
        expect(mockNavigate).toHaveBeenCalledWith("/game#plays", {
            replace: false,
        });
    });
});
