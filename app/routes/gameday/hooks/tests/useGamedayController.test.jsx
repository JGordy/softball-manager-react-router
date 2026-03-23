import { renderHook, act } from "@testing-library/react";
import { useGamedayTabs } from "../useGamedayTabs";
import { useGamedayActions } from "../useGamedayActions";
import { useGameState } from "../useGameState";
import { useGameUpdates } from "@/hooks/useGameUpdates";
import { useGamedayController } from "../useGamedayController";

jest.mock("../useGamedayTabs");
jest.mock("../useGamedayActions");
jest.mock("../useGameState");
jest.mock("@/hooks/useGameUpdates");

describe("useGamedayController", () => {
    const mockGame = { $id: "game1", gameDate: "2024-01-01" };
    const mockPlayerChart = [
        { $id: "p1", firstName: "John", lastName: "Doe" },
        { $id: "p2", firstName: "Jane", lastName: "Smith" },
        { $id: "p3", firstName: "Bob", lastName: "Johnson" },
    ];
    const mockTeam = { $id: "team1" };

    beforeEach(() => {
        jest.clearAllMocks();

        useGamedayTabs.mockReturnValue({
            activeTab: "live",
            handleTabChange: jest.fn(),
            setActiveTab: jest.fn(),
        });

        useGameState.mockReturnValue({
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
            runners: {},
            setRunners: jest.fn(),
            battingOrderIndex: 0,
            setBattingOrderIndex: jest.fn(),
        });

        useGamedayActions.mockReturnValue({
            pendingAction: null,
            drawerOpened: false,
            openDrawer: jest.fn(),
            closeDrawer: jest.fn(),
            advanceHalfInning: jest.fn(),
            handleOpponentRun: jest.fn(),
            handleOpponentOut: jest.fn(),
            initiateAction: jest.fn(),
            completeAction: jest.fn(),
            undoLast: jest.fn(),
            isSubmitting: false,
            fetcher: { data: null, state: "idle" },
        });

        useGameUpdates.mockReturnValue({ status: "connected" });
    });

    it("initializes logs with initialLogs", () => {
        const initialLogs = [{ $id: "log1", action: "hit" }];
        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
                initialLogs,
            }),
        );

        expect(result.current.logs).toEqual(initialLogs);
    });

    it("deduplicates logs when receiving new logs via useGameUpdates", () => {
        let onNewLogCallback;
        useGameUpdates.mockImplementation((id, options) => {
            onNewLogCallback = options.onNewLog;
            return { status: "connected" };
        });

        const initialLogs = [{ $id: "log1", action: "hit" }];
        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
                initialLogs,
            }),
        );

        act(() => {
            onNewLogCallback({ $id: "log1", action: "hit" }); // Duplicate
            onNewLogCallback({ $id: "log2", action: "out" }); // New
        });

        expect(result.current.logs).toHaveLength(2);
        expect(result.current.logs[1].$id).toBe("log2");
    });

    it("calculates dueUpBatters correctly based on battingOrderIndex", () => {
        useGameState.mockReturnValue({
            battingOrderIndex: 1, // Jane Smith is up
            // ... other values
        });

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
            }),
        );

        expect(result.current.currentBatter.$id).toBe("p2");
        expect(result.current.upcomingBatters[0].$id).toBe("p3");
        expect(result.current.upcomingBatters[1].$id).toBe("p1"); // Wraps around
        expect(result.current.dueUpBatters).toHaveLength(3);
        expect(result.current.dueUpBatters[0].$id).toBe("p2");
    });

    it("determines isOurBatting correctly", () => {
        // Away game, top inning -> batting
        const { result: awayTop } = renderHook(() =>
            useGamedayController({
                game: { ...mockGame, isHomeGame: false },
                playerChart: mockPlayerChart,
                team: mockTeam,
            }),
        );
        expect(awayTop.current.isOurBatting).toBe(true);

        // Home game, top inning -> fielding
        const { result: homeTop } = renderHook(() =>
            useGamedayController({
                game: { ...mockGame, isHomeGame: true },
                playerChart: mockPlayerChart,
                team: mockTeam,
            }),
        );
        expect(homeTop.current.isOurBatting).toBe(false);
    });

    it("returns isSyncing true when fetcher or realtime status indicates syncing", () => {
        useGamedayActions.mockReturnValue({
            fetcher: { state: "submitting" },
        });

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
            }),
        );

        expect(result.current.isSyncing).toBe(true);
    });
});
