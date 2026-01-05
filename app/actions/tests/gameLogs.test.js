import {
    createDocument,
    deleteDocument,
    readDocument,
    updateDocument,
} from "@/utils/databases";
import { logGameEvent, undoGameEvent } from "../gameLogs";

jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    deleteDocument: jest.fn(),
    readDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

describe("gameLogs actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("logGameEvent", () => {
        it("should successfully log a game event and update score", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "player456",
                eventType: "1B",
                rbi: 1,
                outsOnPlay: 0,
                description: "John Doe singles",
                baseState: { first: true, second: false, third: false },
            };

            createDocument.mockResolvedValue({ $id: "log789", ...mockPayload });
            readDocument.mockResolvedValue({ score: "5" });
            updateDocument.mockResolvedValue({});

            const result = await logGameEvent(mockPayload);

            expect(createDocument).toHaveBeenCalledWith("game_logs", null, {
                gameId: "game123",
                inning: 1,
                halfInning: "top",
                playerId: "player456",
                eventType: "single",
                rbi: 1,
                outsOnPlay: 0,
                description: "John Doe singles",
                baseState: JSON.stringify(mockPayload.baseState),
            });
            expect(readDocument).toHaveBeenCalledWith("games", "game123");
            expect(updateDocument).toHaveBeenCalledWith("games", "game123", {
                score: "6",
            });
            expect(result.success).toBe(true);
            expect(result.log.$id).toBe("log789");
        });

        it("should log a game event without updating score if rbi is 0", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "player456",
                eventType: "K",
                rbi: 0,
                outsOnPlay: 1,
                description: "K",
                baseState: {},
            };

            createDocument.mockResolvedValue({ $id: "log790", ...mockPayload });

            const result = await logGameEvent(mockPayload);

            expect(createDocument).toHaveBeenCalled();
            expect(readDocument).not.toHaveBeenCalled();
            expect(updateDocument).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it("should handle errors when logging a game event", async () => {
            createDocument.mockRejectedValue(new Error("Database error"));

            const result = await logGameEvent({ inning: "1" });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Database error");
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("undoGameEvent", () => {
        it("should successfully undo a game event and revert score", async () => {
            readDocument.mockResolvedValueOnce({
                gameId: "game123",
                rbi: 1,
            });
            readDocument.mockResolvedValueOnce({
                score: "10",
            });
            updateDocument.mockResolvedValue({});
            deleteDocument.mockResolvedValue({});

            const result = await undoGameEvent({ logId: "log789" });

            expect(readDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(readDocument).toHaveBeenCalledWith("games", "game123");
            expect(updateDocument).toHaveBeenCalledWith("games", "game123", {
                score: "9",
            });
            expect(deleteDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(result.success).toBe(true);
        });

        it("should undo a game event without reverting score if rbi was 0", async () => {
            readDocument.mockResolvedValueOnce({
                gameId: "game123",
                rbi: 0,
            });
            deleteDocument.mockResolvedValue({});

            const result = await undoGameEvent({ logId: "log789" });

            expect(readDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(updateDocument).not.toHaveBeenCalled();
            expect(deleteDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(result.success).toBe(true);
        });

        it("should handle errors when undoing a game event", async () => {
            readDocument.mockRejectedValue(new Error("Fetch error"));

            const result = await undoGameEvent({ logId: "log789" });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Fetch error");
            expect(console.error).toHaveBeenCalled();
        });
    });
});
