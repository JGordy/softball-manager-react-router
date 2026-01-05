import {
    createDocument,
    deleteDocument,
    readDocument,
    createTransaction,
    createOperations,
    commitTransaction,
    rollbackTransaction,
} from "@/utils/databases";
import { logGameEvent, undoGameEvent } from "../gameLogs";

jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    deleteDocument: jest.fn(),
    readDocument: jest.fn(),
    updateDocument: jest.fn(),
    createTransaction: jest.fn(),
    createOperations: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    collections: {
        game_logs: "GAME_LOGS_COLLECTION_ID",
        games: "GAMES_COLLECTION_ID",
    },
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
        it("should successfully log a game event and update score using transaction", async () => {
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

            const mockTransaction = { $id: "txn-123" };
            createTransaction.mockResolvedValue(mockTransaction);
            readDocument.mockResolvedValue({ score: "5" });
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await logGameEvent(mockPayload);

            expect(createTransaction).toHaveBeenCalled();
            expect(readDocument).toHaveBeenCalledWith("games", "game123");
            expect(createOperations).toHaveBeenCalledWith(
                "txn-123",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "create",
                        tableId: "GAME_LOGS_COLLECTION_ID",
                        data: expect.objectContaining({
                            gameId: "game123",
                            inning: 1,
                            halfInning: "top",
                            playerId: "player456",
                            eventType: "single",
                            rbi: 1,
                            outsOnPlay: 0,
                            description: "John Doe singles",
                            baseState: JSON.stringify(mockPayload.baseState),
                        }),
                    }),
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { score: "6" },
                    }),
                ]),
            );
            expect(commitTransaction).toHaveBeenCalledWith("txn-123");
            expect(result.success).toBe(true);
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
            expect(createTransaction).not.toHaveBeenCalled();
            expect(readDocument).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it("should handle errors and rollback transaction when logging fails", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "player456",
                eventType: "1B",
                rbi: 1,
                outsOnPlay: 0,
                description: "Single",
                baseState: {},
            };

            const mockTransaction = { $id: "txn-123" };
            createTransaction.mockResolvedValue(mockTransaction);
            readDocument.mockResolvedValue({ score: "5" });
            createOperations.mockRejectedValue(new Error("Database error"));
            rollbackTransaction.mockResolvedValue({});

            const result = await logGameEvent(mockPayload);

            expect(rollbackTransaction).toHaveBeenCalledWith("txn-123");
            expect(result.success).toBe(false);
            expect(result.error).toBe("Database error");
            expect(console.error).toHaveBeenCalled();
        });

        it("should handle invalid baseState", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "player456",
                eventType: "K",
                rbi: 0,
                outsOnPlay: 1,
                description: "K",
                baseState: undefined,
            };

            // Create circular reference
            const circular = {};
            circular.self = circular;
            mockPayload.baseState = circular;

            const result = await logGameEvent(mockPayload);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid baseState data");
        });
    });

    describe("undoGameEvent", () => {
        it("should successfully undo a game event and revert score using transaction", async () => {
            const mockLog = {
                gameId: "game123",
                rbi: 1,
            };

            const mockTransaction = { $id: "txn-456" };
            readDocument.mockResolvedValueOnce(mockLog);
            readDocument.mockResolvedValueOnce({ score: "10" });
            createTransaction.mockResolvedValue(mockTransaction);
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await undoGameEvent({ logId: "log789" });

            expect(readDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(readDocument).toHaveBeenCalledWith("games", "game123");
            expect(createTransaction).toHaveBeenCalled();
            expect(createOperations).toHaveBeenCalledWith(
                "txn-456",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { score: "9" },
                    }),
                    expect.objectContaining({
                        action: "delete",
                        tableId: "GAME_LOGS_COLLECTION_ID",
                        rowId: "log789",
                    }),
                ]),
            );
            expect(commitTransaction).toHaveBeenCalledWith("txn-456");
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
            expect(createTransaction).not.toHaveBeenCalled();
            expect(deleteDocument).toHaveBeenCalledWith("game_logs", "log789");
            expect(result.success).toBe(true);
        });

        it("should handle errors and rollback transaction when undo fails", async () => {
            const mockLog = {
                gameId: "game123",
                rbi: 1,
            };

            const mockTransaction = { $id: "txn-456" };
            readDocument.mockResolvedValueOnce(mockLog);
            readDocument.mockResolvedValueOnce({ score: "10" });
            createTransaction.mockResolvedValue(mockTransaction);
            createOperations.mockRejectedValue(new Error("Fetch error"));
            rollbackTransaction.mockResolvedValue({});

            const result = await undoGameEvent({ logId: "log789" });

            expect(rollbackTransaction).toHaveBeenCalledWith("txn-456");
            expect(result.success).toBe(false);
            expect(result.error).toBe("Fetch error");
            expect(console.error).toHaveBeenCalled();
        });
    });
});
