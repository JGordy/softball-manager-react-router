import { renderHook } from "@testing-library/react";
import { useGamedayActions } from "../useGamedayActions";

jest.mock("react-router", () => ({
    useFetcher: () => ({
        submit: jest.fn(),
        state: "idle",
    }),
}));

describe("useGamedayActions", () => {
    it("initializes without crashing", () => {
        const mockProps = {
            playerChart: [{ $id: "p1", firstName: "Root", lastName: "Player" }],
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

        const { result } = renderHook(() => useGamedayActions(mockProps));
        expect(typeof result.current.completeAction).toBe("function");
    });
});
