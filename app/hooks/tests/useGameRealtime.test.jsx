import { renderHook, waitFor, act } from "@/utils/test-utils";
import { client } from "@/utils/appwrite/client";
import { useGameRealtime } from "../useGameRealtime";

// Mock dependencies
jest.mock("@/utils/appwrite/client", () => ({
    client: {
        setSession: jest.fn(),
        subscribe: jest.fn(),
    },
}));

// Mock fetch
global.fetch = jest.fn();

describe("useGameRealtime Hook", () => {
    const mockOnGameUpdate = jest.fn();
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            VITE_APPWRITE_DATABASE_ID: "db-id",
            VITE_APPWRITE_GAMES_COLLECTION_ID: "games-col-id",
        };

        // Default mock fetch session response
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ session: "mock-session" }),
        });
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("should do nothing if gameId is missing", () => {
        renderHook(() =>
            useGameRealtime(null, { onGameUpdate: mockOnGameUpdate }),
        );
        expect(client.subscribe).not.toHaveBeenCalled();
    });

    it("should do nothing if disabled is true", () => {
        renderHook(() =>
            useGameRealtime("game-123", {
                onGameUpdate: mockOnGameUpdate,
                enabled: false,
            }),
        );
        expect(client.subscribe).not.toHaveBeenCalled();
    });

    it("should subscribe to databases tables and trigger update callback", async () => {
        let updateCallback;
        const unsubscribeMock = jest.fn();

        client.subscribe.mockImplementation((channel, callback) => {
            updateCallback = callback;
            return unsubscribeMock;
        });

        const { unmount } = renderHook(() =>
            useGameRealtime("game-123", { onGameUpdate: mockOnGameUpdate }),
        );

        // Wait for session sync and connection setup
        await waitFor(() => {
            expect(client.subscribe).toHaveBeenCalled();
        });

        // Verify correct database realtime channel subscription
        expect(client.subscribe).toHaveBeenCalledWith(
            "databases.db-id.tables.games-col-id.rows",
            expect.any(Function),
        );

        // Simulate an Appwrite update event for a different game ID
        act(() => {
            updateCallback({
                payload: { $id: "different-game" },
                events: [
                    "databases.db-id.tables.games-col-id.rows.different-game.update",
                ],
            });
        });
        expect(mockOnGameUpdate).not.toHaveBeenCalled();

        // Simulate an Appwrite update event for our target game ID
        const updatePayload = {
            $id: "game-123",
            recap: "Fascinating recap text",
        };
        act(() => {
            updateCallback({
                payload: updatePayload,
                events: [
                    "databases.db-id.tables.games-col-id.rows.game-123.update",
                ],
            });
        });

        // Verify callback triggered successfully
        expect(mockOnGameUpdate).toHaveBeenCalledWith(updatePayload);

        // Verify unmounting calls unsubscribe
        unmount();
        expect(unsubscribeMock).toHaveBeenCalled();
    });
});
