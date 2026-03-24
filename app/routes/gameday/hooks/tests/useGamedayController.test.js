import { renderHook, act } from "@testing-library/react";
import { useGamedayController } from "../useGamedayController";

jest.mock("@/hooks/useGameUpdates", () => ({
    useGameUpdates: () => ({ status: "connected" }),
}));

jest.mock("../useGamedayTabs", () => ({
    useGamedayTabs: () => ({
        activeTab: "controls",
        setActiveTab: jest.fn(),
        handleTabChange: jest.fn(),
    }),
}));

jest.mock("../useGamedayActions", () => ({
    useGamedayActions: () => ({
        pendingAction: null,
        drawerOpened: false,
        openDrawer: jest.fn(),
        closeDrawer: jest.fn(),
        handleSubCurrentBatter: jest.fn(),
    }),
}));

jest.mock("../useGameState", () => ({
    useGameState: () => ({
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
    }),
}));

describe("useGamedayController", () => {
    it("initializes without crashing and computes eligible substitutes", () => {
        const mockProps = {
            game: { $id: "game1", gameDate: "2023-01-01" },
            playerChart: [{ $id: "p1", substitutions: [{ playerId: "sub1" }] }],
            team: { $id: "team1" },
            initialLogs: [],
            players: [{ $id: "p1" }, { $id: "sub1" }, { $id: "eligible_guy" }],
            isScorekeeper: true,
            isDesktop: false,
        };

        const { result } = renderHook(() => useGamedayController(mockProps));
        expect(result.current.eligibleSubstitutes).toHaveLength(1);
        expect(result.current.eligibleSubstitutes[0].$id).toBe("eligible_guy");
    });
});
