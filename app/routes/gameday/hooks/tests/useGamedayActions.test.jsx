import { useFetcher } from "react-router";
import { renderHook, act } from "@testing-library/react";

import { useGamedayActions } from "../useGamedayActions";

jest.mock("react-router", () => ({
    useFetcher: jest.fn(),
}));

describe("useGamedayActions", () => {
    const mockSubmit = jest.fn();
    const mockFetcher = {
        state: "idle",
        submit: mockSubmit,
    };

    const defaultProps = {
        playerChart: [
            { $id: "p1", firstName: "Alice", lastName: "Player" },
            { $id: "p2", firstName: "Bob", lastName: "Batter" },
        ],
        team: { $id: "team1" },
        inning: 1,
        setInning: jest.fn(),
        halfInning: "top",
        setHalfInning: jest.fn(),
        outs: 0,
        setOuts: jest.fn(),
        score: 0,
        setScore: jest.fn(),
        opponentScore: 0,
        setOpponentScore: jest.fn(),
        runners: { first: null, second: null, third: null },
        setRunners: jest.fn(),
        battingOrderIndex: 0,
        setBattingOrderIndex: jest.fn(),
        logs: [],
        isScorekeeper: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue(mockFetcher);
    });

    it("initializes to default state", () => {
        const { result } = renderHook(() => useGamedayActions(defaultProps));
        expect(result.current.pendingAction).toBeNull();
        expect(result.current.drawerOpened).toBe(false);
    });

    it("handles opponent run correctly", () => {
        const { result } = renderHook(() => useGamedayActions(defaultProps));

        act(() => {
            result.current.handleOpponentRun();
        });

        expect(defaultProps.setOpponentScore).toHaveBeenCalledWith(1);

        expect(mockSubmit).toHaveBeenCalledWith(
            { _action: "update-game-score", opponentScore: 1 },
            { method: "post" },
        );
    });

    it("handles opponent out with inning advance", () => {
        const propsWith2Outs = { ...defaultProps, outs: 2 };
        const { result } = renderHook(() => useGamedayActions(propsWith2Outs));

        act(() => {
            result.current.handleOpponentOut();
        });

        expect(defaultProps.setOuts).toHaveBeenCalledWith(0);

        expect(defaultProps.setHalfInning).toHaveBeenCalledWith("bottom");
        expect(defaultProps.setRunners).toHaveBeenCalledWith({
            first: null,
            second: null,
            third: null,
        });
    });

    it("handles simple strikeout completeAction", () => {
        const { result } = renderHook(() => useGamedayActions(defaultProps));

        act(() => {
            result.current.completeAction("K");
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                _action: "log-game-event",
                eventType: "K",
                outsOnPlay: 1,
            }),
            { method: "post" },
        );

        expect(defaultProps.setOuts).toHaveBeenCalledWith(1);
        expect(defaultProps.setBattingOrderIndex).toHaveBeenCalledWith(1);
    });

    it("undoLast calls fetcher submit", () => {
        const logsWithEntry = [{ $id: "log123" }];
        const { result } = renderHook(() =>
            useGamedayActions({ ...defaultProps, logs: logsWithEntry }),
        );

        act(() => {
            result.current.undoLast();
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            { _action: "undo-game-event", logId: "log123" },
            { method: "post" },
        );
    });
});
