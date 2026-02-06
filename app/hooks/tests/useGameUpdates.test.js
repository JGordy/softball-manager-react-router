import { renderHook, waitFor, act } from "@/utils/test-utils";
import { DateTime } from "luxon";
import { client } from "@/utils/appwrite/client";

import { useGameUpdates } from "../useGameUpdates";

// Mock dependencies
jest.mock("@/utils/appwrite/client", () => ({
    client: {
        setSession: jest.fn(),
        subscribe: jest.fn(),
    },
}));

// Mock fetch
global.fetch = jest.fn();

describe("useGameUpdates", () => {
    const mockHandlers = {
        onNewLog: jest.fn(),
        onUpdateLog: jest.fn(),
        onDeleteLog: jest.fn(),
    };

    // Mock vars for environment
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        process.env = {
            ...originalEnv,
            VITE_APPWRITE_DATABASE_ID: "db-id",
            VITE_APPWRITE_GAME_LOGS_COLLECTION_ID: "col-id",
        };

        // Default fetching mock
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ session: "mock-session" }),
        });
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.useRealTimers();
    });

    it("returns idle status if gameId is missing", () => {
        const { result } = renderHook(() => useGameUpdates(null, mockHandlers));
        expect(result.current.status).toBe("idle");
    });

    it("returns idle status if gameFinal is true", () => {
        const { result } = renderHook(() =>
            useGameUpdates("game-1", {
                ...mockHandlers,
                gameFinal: true,
            }),
        );
        expect(result.current.status).toBe("idle");
    });

    it("returns idle status if current time is outside window", () => {
        // Mock time to be way after game
        const gameDate = DateTime.now().minus({ days: 1 }).toISO();

        const { result } = renderHook(() =>
            useGameUpdates("game-1", {
                ...mockHandlers,
                gameDate,
            }),
        );

        expect(result.current.status).toBe("idle");
    });

    it("connects when conditions are met and handles updates", async () => {
        // Mock subscribe to capture callback
        let updateCallback;
        const unsubscribeMock = jest.fn();
        client.subscribe.mockImplementation((channels, callback) => {
            updateCallback = callback;
            return unsubscribeMock;
        });

        // Current time is game time
        const gameDate = DateTime.now().toISO();

        const { result } = renderHook(() =>
            useGameUpdates("game-1", {
                ...mockHandlers,
                gameDate,
            }),
        );

        // Should start connecting
        expect(result.current.status).toBe("connecting");

        // Wait for connection to establish (after fetch session etc)
        // Since init is async, we need to wait
        await waitFor(() => {
            expect(client.subscribe).toHaveBeenCalled();
        });

        expect(result.current.status).toBe("connected");

        // Verify channels
        expect(client.subscribe).toHaveBeenCalledWith(
            ["databases.db-id.tables.col-id.rows"],
            expect.any(Function),
        );

        // Simulate an event (update) for the correct gameId
        const updatePayload = {
            gameId: "game-1",
            $id: "log-1",
            someData: "abc",
        };
        const updateEvent = {
            payload: updatePayload,
            events: ["databases.x.tables.y.rows.log-1.update"],
        };

        act(() => {
            updateCallback(updateEvent);
        });

        // Status "syncing" immediate
        expect(result.current.status).toBe("syncing");

        // Advance timers to trigger handler (1000ms delay)
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockHandlers.onUpdateLog).toHaveBeenCalledWith(updatePayload);
        expect(result.current.status).toBe("connected");
    });

    it("handles new log creation", async () => {
        let updateCallback;
        client.subscribe.mockImplementation((c, cb) => {
            updateCallback = cb;
            return jest.fn();
        });

        const gameDate = DateTime.now().toISO();
        const { result } = renderHook(() =>
            useGameUpdates("game-1", { ...mockHandlers, gameDate }),
        );

        await waitFor(() => expect(client.subscribe).toHaveBeenCalled());

        act(() => {
            updateCallback({
                payload: { gameId: "game-1", $id: "log-2" },
                events: ["...create"],
            });
        });

        act(() => jest.advanceTimersByTime(1000));

        expect(mockHandlers.onNewLog).toHaveBeenCalled();
    });

    it("handles log deletion", async () => {
        let updateCallback;
        client.subscribe.mockImplementation((c, cb) => {
            updateCallback = cb;
            return jest.fn();
        });

        const gameDate = DateTime.now().toISO();
        const { result } = renderHook(() =>
            useGameUpdates("game-1", { ...mockHandlers, gameDate }),
        );

        await waitFor(() => expect(client.subscribe).toHaveBeenCalled());

        act(() => {
            updateCallback({
                payload: { gameId: "game-1", $id: "log-3" },
                events: ["...delete"],
            });
        });

        act(() => jest.advanceTimersByTime(1000));

        expect(mockHandlers.onDeleteLog).toHaveBeenCalledWith("log-3");
    });
});
