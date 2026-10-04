import { renderHook, act } from "@testing-library/react";
import { useGameState } from "../useGameState";

describe("useGameState", () => {
    const defaultGame = { score: 0, opponentScore: 0 };
    const playerChart = [
        { $id: "p1", firstName: "Alice" },
        { $id: "p2", firstName: "Bob" },
        { $id: "p3", firstName: "Charlie" },
    ];

    it("initializes with default values", () => {
        const { result } = renderHook(() =>
            useGameState({ logs: [], game: defaultGame, playerChart }),
        );

        expect(result.current.inning).toBe(1);
        expect(result.current.halfInning).toBe("top");
        expect(result.current.outs).toBe(0);
        expect(result.current.runners).toEqual({
            first: null,
            second: null,
            third: null,
        });
        expect(result.current.battingOrderIndex).toBe(0);
    });

    it("calculates state from logs", () => {
        const logs = [
            {
                $id: "log1",
                playerId: "p1",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 1,
                baseState: JSON.stringify({
                    first: null,
                    second: null,
                    third: null,
                }),
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game: defaultGame, playerChart }),
        );

        expect(result.current.inning).toBe(1);
        expect(result.current.halfInning).toBe("top");
        expect(result.current.outs).toBe(1);
        expect(result.current.battingOrderIndex).toBe(1);
    });

    it("ignores 'SUB' logs when calculating the next batter", () => {
        const logs = [
            {
                $id: "log1",
                playerId: "p1",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 1, // At-bat completes, advances index to p2 (index 1)
                baseState: "{}",
                eventType: "1B",
            },
            {
                $id: "log2",
                playerId: "sub99",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 0,
                baseState: "{}",
                eventType: "SUB",
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game: defaultGame, playerChart }),
        );

        // Even though log2 happened, it's a SUB, so the engine should correctly see log1
        // as the last at-bat and remain on index 1 for p2.
        expect(result.current.battingOrderIndex).toBe(1);
    });

    it("advances inning when 3 outs", () => {
        const logs = [
            {
                $id: "log1",
                playerId: "p1",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 3, // Should trigger half inning change
                baseState: "{}",
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game: defaultGame, playerChart }),
        );

        expect(result.current.halfInning).toBe("bottom");
        expect(result.current.outs).toBe(0);
        expect(result.current.runners).toEqual({
            first: null,
            second: null,
            third: null,
        });
    });

    it("correctly identifies on deck batter", () => {
        const logs = [{ $id: "log1", playerId: "p1" }]; // p1 batted last
        const { result } = renderHook(() =>
            useGameState({ logs, game: defaultGame, playerChart }),
        );

        // Next batter is p2 (index 1)
        expect(result.current.battingOrderIndex).toBe(1);
    });

    it("uses game score from props", () => {
        const game = { score: 5, opponentScore: 3 };
        const { result } = renderHook(() =>
            useGameState({ logs: [], game, playerChart }),
        );

        expect(result.current.score).toBe(5);
        expect(result.current.opponentScore).toBe(3);
    });

    it("handles opponent run events by updating opponent score and ignoring batting index", () => {
        const game = { score: 5, opponentScore: 0, isHomeGame: true };
        const logs = [
            {
                $id: "log1",
                playerId: "p1",
                inning: 1,
                halfInning: "bottom", // we are batting (home team)
                outsOnPlay: 1,
                rbi: 1,
                baseState: "{}",
                eventType: "1B",
            },
            {
                $id: "log2",
                inning: 2,
                halfInning: "top", // opponent is batting
                outsOnPlay: 0,
                rbi: 2,
                baseState: JSON.stringify({ isOpponent: true }),
                eventType: "opponent_run",
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game, playerChart }),
        );

        // Batting order index should be 1 (after p1), ignoring opponent run
        expect(result.current.battingOrderIndex).toBe(1);

        // Score should be 1 (logBasedScore: 1)
        expect(result.current.score).toBe(1);

        // Opponent score should be 2 (logBasedOpponentScore: 2)
        expect(result.current.opponentScore).toBe(2);
    });

    it("calculates opponentOrderIndex correctly based on last opponent at-bat when opponent chart is empty", () => {
        const game = {
            score: 0,
            opponentScore: 0,
            isHomeGame: true,
            opponentLineupLocked: false,
        };
        const logs = [
            {
                $id: "opp_log1",
                playerId: "OPP_BAT_4",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 1,
                baseState: JSON.stringify({ isOpponent: true }),
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game, playerChart, opponentChart: [] }),
        );

        expect(result.current.opponentOrderIndex).toBe(4);
    });

    it("calculates next opponentOrderIndex correctly when opponent lineup is locked", () => {
        const game = {
            score: 0,
            opponentScore: 0,
            isHomeGame: true,
            opponentLineupLocked: true,
        };
        const opponentChart = [
            { $id: "opp1", firstName: "Opp1" },
            { $id: "opp2", firstName: "Opp2" },
        ];
        const logs = [
            {
                $id: "opp_log1",
                playerId: "opp1",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 1,
                baseState: JSON.stringify({ isOpponent: true }),
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game, playerChart, opponentChart }),
        );

        // Opponent lineup locked: should wrap to index 1 (opp2)
        expect(result.current.opponentOrderIndex).toBe(1);
    });

    it("sets opponentOrderIndex exactly to selected index without advancing when last log is opponent_lineup_pointer", () => {
        const game = {
            score: 0,
            opponentScore: 0,
            isHomeGame: true,
            opponentLineupLocked: false,
        };
        const logs = [
            {
                $id: "opp_log1",
                playerId: "OPP_BAT_3",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_lineup_pointer",
                baseState: JSON.stringify({ isOpponent: true }),
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game, playerChart, opponentChart: [] }),
        );

        // opponent_lineup_pointer should set the active batter to index 2 exactly, without incrementing it
        expect(result.current.opponentOrderIndex).toBe(2);
    });

    it("sets opponentOrderIndex to 0 when last log is opponent_lineup_wrap", () => {
        const game = {
            score: 0,
            opponentScore: 0,
            isHomeGame: true,
            opponentLineupLocked: true,
        };
        const logs = [
            {
                $id: "opp_log1",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_lineup_wrap",
                baseState: JSON.stringify({ isOpponent: true }),
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game, playerChart, opponentChart: [] }),
        );

        // opponent_lineup_wrap should reset the active batter to index 0
        expect(result.current.opponentOrderIndex).toBe(0);
    });

    it("skips players who are marked as removed with type 'skip'", () => {
        const playerChartWithRemoved = [
            { $id: "p1", firstName: "Alice" },
            { $id: "p2", firstName: "Bob", removed: true, removalType: "skip" },
            { $id: "p3", firstName: "Charlie" },
        ];

        // Scenario: p1 batted last; next should skip removed p2 and advance to p3
        const logs = [
            {
                $id: "log1",
                playerId: "p1",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 1,
                baseState: "{}",
            },
        ];

        const { result } = renderHook(() =>
            useGameState({
                logs,
                game: defaultGame,
                playerChart: playerChartWithRemoved,
            }),
        );

        // p1 batted last. Next is index 1 (Bob), but Bob is skipped, so index should be 2 (Charlie).
        expect(result.current.battingOrderIndex).toBe(2);
    });

    it("ignores 'INJURY_REMOVE' logs when calculating the next batter", () => {
        const logs = [
            {
                $id: "log1",
                playerId: "p1",
                inning: 1,
                halfInning: "top",
                outsOnPlay: 1, // Alice bats, index advances to p2 (index 1)
                baseState: "{}",
                eventType: "1B",
            },
            {
                $id: "log2",
                playerId: "p3", // Charlie is removed
                inning: 1,
                halfInning: "top",
                outsOnPlay: 0,
                baseState: "{}",
                eventType: "INJURY_REMOVE",
            },
        ];

        const { result } = renderHook(() =>
            useGameState({ logs, game: defaultGame, playerChart }),
        );

        // Even though log2 happened, it's an INJURY_REMOVE, so the engine should correctly see log1
        // as the last at-bat and remain on index 1 for p2.
        expect(result.current.battingOrderIndex).toBe(1);
    });

    it("preserves local opponent outs when an opponent_run event is added in the same half-inning", () => {
        const homeGame = {
            ...defaultGame,
            $id: "game1",
            isHomeGame: true, // Opponent bats in top half
        };

        const { result, rerender } = renderHook(
            ({ logs }) =>
                useGameState({
                    logs,
                    game: homeGame,
                    playerChart,
                }),
            { initialProps: { logs: [] } },
        );

        expect(result.current.halfInning).toBe("top");
        expect(result.current.outs).toBe(0);

        // Scorekeeper records an out locally for the opponent
        act(() => {
            result.current.setOuts(1);
        });

        // Opponent then scores a run which adds an opponent_run log (outsOnPlay: 0)
        const newLogs = [
            {
                $id: "opp_run_1",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_run",
                rbi: 1,
                outsOnPlay: 0,
                baseState: JSON.stringify({ isOpponent: true, currentOuts: 1 }),
            },
        ];

        rerender({ logs: newLogs });

        // Outs should remain 1 and not be wiped to 0
        expect(result.current.outs).toBe(1);
        expect(result.current.opponentScore).toBe(1);
    });

    it("restores opponent outs from baseState.currentOuts on fresh mount", () => {
        const homeGame = {
            ...defaultGame,
            $id: "game1",
            isHomeGame: true,
        };

        const logs = [
            {
                $id: "opp_run_1",
                inning: 1,
                halfInning: "top",
                eventType: "opponent_run",
                rbi: 2,
                outsOnPlay: 0,
                baseState: JSON.stringify({ isOpponent: true, currentOuts: 2 }),
            },
        ];

        const { result } = renderHook(() =>
            useGameState({
                logs,
                game: homeGame,
                playerChart,
            }),
        );

        expect(result.current.outs).toBe(2);
        expect(result.current.opponentScore).toBe(2);
    });

    it("restores opponent outs from sessionStorage when present", () => {
        const homeGame = {
            ...defaultGame,
            $id: "game_session_1",
            isHomeGame: true,
        };

        sessionStorage.setItem(
            "gameday_opponent_outs_game_session_1",
            JSON.stringify({
                gameId: "game_session_1",
                inning: 1,
                halfInning: "top",
                outs: 1,
            }),
        );

        const { result } = renderHook(() =>
            useGameState({
                logs: [],
                game: homeGame,
                playerChart,
            }),
        );

        expect(result.current.outs).toBe(1);
        sessionStorage.removeItem("gameday_opponent_outs_game_session_1");
    });
});
