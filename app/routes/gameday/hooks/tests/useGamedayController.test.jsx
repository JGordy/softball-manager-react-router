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
            opponentOrderIndex: 0,
            setOpponentOrderIndex: jest.fn(),
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
            halfInning: "top", // Away team bats top
            opponentOrderIndex: 0,
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

    it("includes substitutes in the batters list and labels them correctly", () => {
        const playerChartWithSubs = [
            {
                $id: "p1",
                firstName: "John",
                lastName: "Doe",
                substitutions: [
                    {
                        playerId: "sub1",
                        firstName: "Substitute",
                        lastName: "Player",
                    },
                ],
            },
        ];

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: playerChartWithSubs,
                team: mockTeam,
            }),
        );

        expect(result.current.batters).toHaveLength(2);
        expect(result.current.batters).toContainEqual({
            value: "p1",
            label: "John Doe",
        });
        expect(result.current.batters).toContainEqual({
            value: "sub1",
            label: "Substitute Player (Sub)",
        });
    });

    it("enriches playerChart and currentBatter with avatarUrl from players array", () => {
        const playersWithAvatars = [
            {
                $id: "p1",
                firstName: "John",
                lastName: "Doe",
                avatarUrl: "http://avatar.url/p1",
            },
            {
                $id: "p2",
                firstName: "Jane",
                lastName: "Smith",
                avatarUrl: "http://avatar.url/p2",
            },
        ];

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
                players: playersWithAvatars,
            }),
        );

        // Verify current batter (p1 at index 0) has the avatarUrl
        expect(result.current.currentBatter.avatarUrl).toBe(
            "http://avatar.url/p1",
        );
        // Verify Jane (p2) also has it in the full chart
        const janeSlot = result.current.playerChart.find((s) => s.$id === "p2");
        expect(janeSlot.avatarUrl).toBe("http://avatar.url/p2");
    });

    it("returns updateAction from useGamedayActions", () => {
        const mockUpdateAction = jest.fn();
        useGamedayActions.mockReturnValue({
            updateAction: mockUpdateAction,
            fetcher: { data: null, state: "idle" },
        });

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
            }),
        );

        expect(result.current.updateAction).toBe(mockUpdateAction);
    });

    it("dynamically pads opponentChart when opponentOrderIndex exceeds default length", () => {
        useGameState.mockReturnValue({
            inning: 1,
            halfInning: "top",
            outs: 0,
            score: 0,
            opponentScore: 0,
            runners: {},
            battingOrderIndex: 0,
            opponentOrderIndex: 12, // 13th batter (past default 12)
        });

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
            }),
        );

        expect(result.current.opponentChart.length).toBe(13);
        expect(result.current.opponentChart[12]).toEqual(
            expect.objectContaining({
                $id: "OPP_BAT_13",
                firstName: "Batter",
                lastName: "13",
            }),
        );
    });

    it("dynamically pads opponentChart based on logs with OPP_BAT_* IDs", () => {
        useGameState.mockReturnValue({
            inning: 1,
            halfInning: "top",
            outs: 0,
            score: 0,
            opponentScore: 0,
            runners: {},
            battingOrderIndex: 0,
            opponentOrderIndex: 0,
        });

        const initialLogs = [
            { $id: "log1", playerId: "OPP_BAT_14", eventType: "1B", rbi: 0 },
        ];

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
                initialLogs,
            }),
        );

        expect(result.current.opponentChart.length).toBe(14);
        expect(result.current.opponentChart[13]).toEqual(
            expect.objectContaining({
                $id: "OPP_BAT_14",
                firstName: "Batter",
                lastName: "14",
            }),
        );
    });

    it("handles undo for INJURY_REMOVE correctly", () => {
        const mockUndoLast = jest.fn();
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
            undoLast: mockUndoLast,
            isSubmitting: false,
            fetcher: { data: null, state: "idle" },
        });

        const playerChartWithRemoval = [
            {
                $id: "p1",
                firstName: "John",
                lastName: "Doe",
                removed: true,
                removalType: "skip",
                removalInning: 1,
            },
            { $id: "p2", firstName: "Jane", lastName: "Smith" },
        ];

        const initialLogs = [
            { $id: "log1", eventType: "INJURY_REMOVE", playerId: "p1" },
        ];

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: playerChartWithRemoval,
                team: mockTeam,
                initialLogs,
                isScorekeeper: true,
            }),
        );

        act(() => {
            result.current.undoLast();
        });

        const expectedRevertedChart = [
            { $id: "p1", firstName: "John", lastName: "Doe" },
            { $id: "p2", firstName: "Jane", lastName: "Smith" },
        ];

        expect(mockUndoLast).toHaveBeenCalledWith(expectedRevertedChart);
    });

    it("handles undo for other events correctly by calling undoLast without arguments", () => {
        const mockUndoLast = jest.fn();
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
            undoLast: mockUndoLast,
            isSubmitting: false,
            fetcher: { data: null, state: "idle" },
        });

        const initialLogs = [{ $id: "log1", eventType: "1B", playerId: "p1" }];

        const { result } = renderHook(() =>
            useGamedayController({
                game: mockGame,
                playerChart: mockPlayerChart,
                team: mockTeam,
                initialLogs,
                isScorekeeper: true,
            }),
        );

        act(() => {
            result.current.undoLast();
        });

        expect(mockUndoLast).toHaveBeenCalledWith();
    });
});
