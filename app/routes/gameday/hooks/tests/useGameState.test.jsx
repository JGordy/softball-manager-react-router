import { renderHook } from "@testing-library/react";
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
});
