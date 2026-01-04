import { createDocument, deleteDocument } from "@/utils/databases";
import { logGameEvent, undoGameEvent } from "../gameLogs";

jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    deleteDocument: jest.fn(),
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
        it("should successfully log a game event", async () => {
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
            expect(result.success).toBe(true);
            expect(result.log.$id).toBe("log789");
        });

        it("should handle errors when logging a game event", async () => {
            createDocument.mockRejectedValue(new Error("Database error"));

            const result = await logGameEvent({ inning: "1" });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Database error");
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("undoLastGameEvent", () => {
        it("should successfully undo a game event", async () => {
            deleteDocument.mockResolvedValue({});

            const result = await undoGameEvent({ logId: "log789" });

            expect(deleteDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(result.success).toBe(true);
        });

        it("should handle errors when undoing a game event", async () => {
            deleteDocument.mockRejectedValue(new Error("Delete error"));

            const result = await undoGameEvent({ logId: "log789" });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Delete error");
            expect(console.error).toHaveBeenCalled();
        });
    });
});
