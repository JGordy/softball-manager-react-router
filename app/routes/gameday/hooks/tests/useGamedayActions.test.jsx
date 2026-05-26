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
        game: { $id: "game1", opponent: "Opponent" },
        currentBatter: { $id: "p1", firstName: "Alice", lastName: "Player" },
        isOurBatting: true,
        opponentOrderIndex: 0,
        setOpponentOrderIndex: jest.fn(),
        opponentChart: [],
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

        expect(defaultProps.setOpponentScore).toHaveBeenCalledWith(
            expect.any(Function),
        );
        const updater = defaultProps.setOpponentScore.mock.calls[0][0];
        expect(updater(0)).toBe(1);

        expect(mockSubmit).toHaveBeenCalledWith(
            {
                _action: "log-game-event",
                teamId: "team1",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_run",
                rbi: 1,
                outsOnPlay: 0,
                description: "Opponent scored 1 run",
                baseState: JSON.stringify({ isOpponent: true }),
            },
            { method: "post" },
        );
    });

    it("handles multiple opponent runs correctly", () => {
        const { result } = renderHook(() => useGamedayActions(defaultProps));

        act(() => {
            result.current.handleOpponentRun(5);
        });

        expect(defaultProps.setOpponentScore).toHaveBeenCalledWith(
            expect.any(Function),
        );
        const updater = defaultProps.setOpponentScore.mock.calls[0][0];
        expect(updater(0)).toBe(5);

        expect(mockSubmit).toHaveBeenCalledWith(
            {
                _action: "log-game-event",
                teamId: "team1",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_run",
                rbi: 5,
                outsOnPlay: 0,
                description: "Opponent scored 5 runs",
                baseState: JSON.stringify({ isOpponent: true }),
            },
            { method: "post" },
        );
    });

    it("handles opponent out with inning advance", () => {
        const propsWith2Outs = { ...defaultProps, outs: 2 };
        const { result } = renderHook(() => useGamedayActions(propsWith2Outs));

        act(() => {
            result.current.handleOpponentOut();
        });

        expect(defaultProps.setOuts).toHaveBeenCalledWith(expect.any(Function));
        const updater = defaultProps.setOuts.mock.calls[0][0];
        expect(updater(2)).toBe(0);

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

    describe("updateAction", () => {
        it("submits update-game-event with the correct logId and payload", () => {
            const { result } = renderHook(() =>
                useGamedayActions(defaultProps),
            );

            act(() => {
                result.current.updateAction("log99", {
                    eventType: "double",
                    rbi: 1,
                    description: "Gordy doubles",
                });
            });

            expect(mockSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    _action: "update-game-event",
                    logId: "log99",
                    eventType: "double",
                    rbi: 1,
                    propagate: "false",
                }),
                { method: "post" },
            );
        });

        it("serializes object baseState to a JSON string before submitting", () => {
            const { result } = renderHook(() =>
                useGamedayActions(defaultProps),
            );
            const baseState = {
                first: null,
                second: "p1",
                third: null,
                scored: [],
            };

            act(() => {
                result.current.updateAction("log99", { baseState });
            });

            const [submitted] = mockSubmit.mock.calls[0];
            expect(submitted.baseState).toBe(JSON.stringify(baseState));
        });

        it("serializes object runnerResults to a JSON string before submitting", () => {
            const { result } = renderHook(() =>
                useGamedayActions(defaultProps),
            );
            const runnerResults = { batter: "second", first: null };

            act(() => {
                result.current.updateAction("log99", { runnerResults });
            });

            const [submitted] = mockSubmit.mock.calls[0];
            expect(submitted.runnerResults).toBe(JSON.stringify(runnerResults));
        });

        it("passes propagate=false as a string when explicitly set", () => {
            const { result } = renderHook(() =>
                useGamedayActions(defaultProps),
            );

            act(() => {
                result.current.updateAction("log99", { eventType: "K" }, false);
            });

            expect(mockSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ propagate: "false" }),
                { method: "post" },
            );
        });

        it("does nothing if isScorekeeper is false", () => {
            const { result } = renderHook(() =>
                useGamedayActions({ ...defaultProps, isScorekeeper: false }),
            );

            act(() => {
                result.current.updateAction("log99", { eventType: "K" });
            });

            expect(mockSubmit).not.toHaveBeenCalled();
        });
    });

    it("handles selecting an active opponent batter slot correctly", () => {
        const { result } = renderHook(() => useGamedayActions(defaultProps));

        act(() => {
            result.current.handleSelectOpponentBatter(5); // index 5 represents Batter 6
        });

        expect(mockSubmit).toHaveBeenCalledWith(
            {
                _action: "log-game-event",
                teamId: "team1",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_lineup_pointer",
                playerId: "OPP_BAT_6",
                rbi: 0,
                outsOnPlay: 0,
                description: "Lineup advanced to Batter 6",
                baseState: JSON.stringify({ isOpponent: true }),
            },
            { method: "post" },
        );
    });
});
