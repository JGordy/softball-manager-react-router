import {
    createDocument,
    deleteDocument,
    readDocument,
    updateDocument,
    createTransaction,
    createOperations,
    commitTransaction,
    rollbackTransaction,
} from "@/utils/databases";
import { logGameEvent, undoGameEvent, updateGameEvent } from "../gameLogs";

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(() => ({ mockedClient: true })),
}));

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
            readDocument.mockResolvedValue({ score: "5", teamId: "team789" });
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(createTransaction).toHaveBeenCalled();
            expect(readDocument).toHaveBeenCalledWith("games", "game123", [], {
                mockedClient: true,
            });
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
                        permissions: expect.arrayContaining([
                            'read("any")',
                            'update("team:team789/scorekeeper")',
                            'delete("team:team789/scorekeeper")',
                        ]),
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
            readDocument.mockResolvedValue({
                $id: "game123",
                teamId: "team789",
                score: "0",
            });

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(createDocument).toHaveBeenCalledWith(
                "game_logs",
                null, // rowId
                expect.objectContaining({
                    gameId: "game123",
                    playerId: "player456",
                }),
                expect.arrayContaining([
                    'read("any")',
                    'update("team:team789/scorekeeper")',
                    'delete("team:team789/scorekeeper")',
                ]),
                { mockedClient: true },
            );
            expect(createTransaction).not.toHaveBeenCalled();
            expect(readDocument).toHaveBeenCalledWith("games", "game123", [], {
                mockedClient: true,
            });
            expect(result.success).toBe(true);
        });

        it("should cast FormData 'null' string literals to native nulls for SDK optional fields", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "player456",
                eventType: "walk",
                rbi: 0,
                outsOnPlay: 0,
                description: "Walk",
                baseState: {},
                battingSide: "null", // formData sends strings
            };

            createDocument.mockResolvedValue({ $id: "log790", ...mockPayload });
            readDocument.mockResolvedValue({ score: "0", teamId: "team789" });

            await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            // Expect createDocument data field to feature actual nulls, not "null" strings
            expect(createDocument).toHaveBeenCalledWith(
                "game_logs",
                null,
                expect.objectContaining({
                    battingSide: null,
                }),
                expect.any(Array),
                expect.any(Object),
            );
        });

        it("should preserve 0 values for hitX and hitY coordinates", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "player456",
                eventType: "1B",
                rbi: 0,
                outsOnPlay: 0,
                description: "Single",
                baseState: {},
                hitX: "0",
                hitY: "0",
            };

            createDocument.mockResolvedValue({ $id: "log790", ...mockPayload });
            readDocument.mockResolvedValue({ score: "0", teamId: "team789" });

            await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(createDocument).toHaveBeenCalledWith(
                "game_logs",
                null,
                expect.objectContaining({
                    hitX: 0,
                    hitY: 0,
                }),
                expect.any(Array),
                expect.any(Object),
            );
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
            readDocument.mockResolvedValue({ score: "5", teamId: "team789" });
            createOperations.mockRejectedValue(new Error("Database error"));
            rollbackTransaction.mockResolvedValue({});

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

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

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("Invalid baseState data");
        });

        it("should successfully log an opponent_run event and update opponentScore using transaction", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "bottom",
                playerId: "player456",
                eventType: "opponent_run",
                rbi: 2,
                outsOnPlay: 0,
                description: "Trinity Red scored 2 runs",
                baseState: { isOpponent: true },
            };

            const mockTransaction = { $id: "txn-123" };
            createTransaction.mockResolvedValue(mockTransaction);
            readDocument.mockResolvedValue({
                opponentScore: "4",
                teamId: "team789",
            });
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(createTransaction).toHaveBeenCalled();
            expect(readDocument).toHaveBeenCalledWith("games", "game123", [], {
                mockedClient: true,
            });
            expect(createOperations).toHaveBeenCalledWith(
                "txn-123",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "create",
                        tableId: "GAME_LOGS_COLLECTION_ID",
                        data: expect.objectContaining({
                            eventType: "opponent_run",
                            rbi: 2,
                            baseState: JSON.stringify(mockPayload.baseState),
                        }),
                    }),
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { opponentScore: "6" },
                    }),
                ]),
            );
            expect(commitTransaction).toHaveBeenCalledWith("txn-123");
            expect(result.success).toBe(true);
        });

        it("should derive isOpponent as true if eventType is regular hit but halfInning and isHomeGame indicate opponent is batting (home game, top inning)", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "top",
                playerId: "OPP_BAT_1",
                eventType: "1B",
                rbi: 1,
                outsOnPlay: 0,
                description: "Opponent singles",
                baseState: {},
            };

            const mockTransaction = { $id: "txn-123" };
            createTransaction.mockResolvedValue(mockTransaction);
            readDocument.mockResolvedValue({
                opponentScore: "4",
                teamId: "team789",
                isHomeGame: true,
            });
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(result.success).toBe(true);
            expect(createOperations).toHaveBeenCalledWith(
                "txn-123",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { opponentScore: "5" },
                    }),
                ]),
            );
        });

        it("should derive isOpponent as true if eventType is regular hit but halfInning and isHomeGame indicate opponent is batting (away game, bottom inning)", async () => {
            const mockPayload = {
                gameId: "game123",
                inning: "1",
                halfInning: "bottom",
                playerId: "OPP_BAT_1",
                eventType: "2B",
                rbi: 2,
                outsOnPlay: 0,
                description: "Opponent doubles",
                baseState: {},
            };

            const mockTransaction = { $id: "txn-123" };
            createTransaction.mockResolvedValue(mockTransaction);
            readDocument.mockResolvedValue({
                opponentScore: "2",
                teamId: "team789",
                isHomeGame: false,
            });
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await logGameEvent({
                ...mockPayload,
                client: { mockedClient: true },
            });

            expect(result.success).toBe(true);
            expect(createOperations).toHaveBeenCalledWith(
                "txn-123",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { opponentScore: "4" },
                    }),
                ]),
            );
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

            const result = await undoGameEvent({
                logId: "log789",
                client: { mockedClient: true },
            });

            expect(readDocument).toHaveBeenCalledWith(
                "game_logs",
                "log789",
                [],
                { mockedClient: true },
            );
            expect(readDocument).toHaveBeenCalledWith("games", "game123", [], {
                mockedClient: true,
            });
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
            expect(result.log).toEqual(mockLog);
        });

        it("should undo a game event without reverting score if rbi was 0", async () => {
            readDocument.mockResolvedValueOnce({
                gameId: "game123",
                rbi: 0,
            });
            deleteDocument.mockResolvedValue({});

            const result = await undoGameEvent({
                logId: "log789",
                client: { mockedClient: true },
            });

            expect(readDocument).toHaveBeenCalledWith(
                "game_logs",
                "log789",
                [],
                { mockedClient: true },
            );
            expect(createTransaction).not.toHaveBeenCalled();
            expect(deleteDocument).toHaveBeenCalledWith("game_logs", "log789", {
                mockedClient: true,
            });
            expect(result.success).toBe(true);
            expect(result.log).toEqual({ gameId: "game123", rbi: 0 });
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

            const result = await undoGameEvent({
                logId: "log789",
                client: { mockedClient: true },
            });

            expect(rollbackTransaction).toHaveBeenCalledWith("txn-456");
            expect(result.success).toBe(false);
            expect(result.error).toBe("Fetch error");
            expect(console.error).toHaveBeenCalled();
        });

        it("should successfully undo an opponent_run event and revert opponentScore using transaction", async () => {
            const mockLog = {
                gameId: "game123",
                eventType: "opponent_run",
                rbi: 2,
            };

            const mockTransaction = { $id: "txn-456" };
            readDocument.mockResolvedValueOnce(mockLog);
            readDocument.mockResolvedValueOnce({ opponentScore: "8" });
            createTransaction.mockResolvedValue(mockTransaction);
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await undoGameEvent({
                logId: "log789",
                client: { mockedClient: true },
            });

            expect(readDocument).toHaveBeenCalledWith(
                "game_logs",
                "log789",
                [],
                { mockedClient: true },
            );
            expect(readDocument).toHaveBeenCalledWith("games", "game123", [], {
                mockedClient: true,
            });
            expect(createTransaction).toHaveBeenCalled();
            expect(createOperations).toHaveBeenCalledWith(
                "txn-456",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { opponentScore: "6" },
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

        it("should successfully undo a regular hit event that produced runs for opponent by deriving opponent-ness from log.halfInning and game.isHomeGame", async () => {
            const mockLog = {
                gameId: "game123",
                eventType: "1B",
                halfInning: "top",
                rbi: 1,
            };

            const mockTransaction = { $id: "txn-456" };
            readDocument.mockResolvedValueOnce(mockLog);
            readDocument.mockResolvedValueOnce({
                opponentScore: "8",
                isHomeGame: true,
            });
            createTransaction.mockResolvedValue(mockTransaction);
            createOperations.mockResolvedValue({});
            commitTransaction.mockResolvedValue({});

            const result = await undoGameEvent({
                logId: "log789",
                client: { mockedClient: true },
            });

            expect(createOperations).toHaveBeenCalledWith(
                "txn-456",
                expect.arrayContaining([
                    expect.objectContaining({
                        action: "update",
                        tableId: "GAMES_COLLECTION_ID",
                        rowId: "game123",
                        data: { opponentScore: "7" },
                    }),
                ]),
            );
            expect(result.success).toBe(true);
        });
    });

    describe("updateGameEvent", () => {
        const mockClient = { mockedClient: true };

        const baseNewData = {
            eventType: "double",
            rbi: "1",
            outsOnPlay: "0",
            description: "Joseph Gordy doubles to RF",
            hitX: "75.63",
            hitY: "40.02",
            hitLocation: "RF",
            battingSide: "right",
            baseState: JSON.stringify({
                first: null,
                second: "player1",
                third: null,
                scored: [],
            }),
            runnerResults: JSON.stringify({
                batter: "second",
                first: null,
                second: null,
                third: null,
            }),
        };

        it("parses hitX and hitY as floats before sending to Appwrite (Direct Update)", async () => {
            // Unchanged RBI (0 -> 0) results in direct updateDocument; game is not fetched
            readDocument.mockResolvedValueOnce({
                $id: "log1",
                gameId: "game1",
                rbi: 0,
            });
            updateDocument.mockResolvedValue({ $id: "log1" });

            const dataNoRBIChange = { ...baseNewData, rbi: "0" };

            await updateGameEvent({
                logId: "log1",
                newData: dataNoRBIChange,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "game_logs",
                "log1",
                expect.objectContaining({
                    hitX: 75.63,
                    hitY: 40.02,
                }),
                mockClient,
            );
        });

        it("parses hitX and hitY as floats before sending to Appwrite (RBI change / score update path)", async () => {
            // Changed RBI (0 -> 1) results in score-first update path
            readDocument
                .mockResolvedValueOnce({ $id: "log1", gameId: "game1", rbi: 0 })
                .mockResolvedValueOnce({ $id: "game1", score: "2" });

            updateDocument
                .mockResolvedValueOnce({ $id: "game1" }) // game score first
                .mockResolvedValueOnce({ $id: "log1" }); // log second

            await updateGameEvent({
                logId: "log1",
                newData: baseNewData,
                client: mockClient,
            });

            expect(createTransaction).not.toHaveBeenCalled();
            expect(updateDocument).toHaveBeenCalledWith(
                "game_logs",
                "log1",
                expect.objectContaining({
                    hitX: 75.63,
                    hitY: 40.02,
                }),
                mockClient,
            );
        });

        it("parses runnerResults JSON string into the bundled baseState", async () => {
            // Unchanged RBI (0 -> 0) results in direct updateDocument; game is not fetched
            readDocument.mockResolvedValueOnce({
                $id: "log1",
                gameId: "game1",
                rbi: 0,
            });
            updateDocument.mockResolvedValue({ $id: "log1" });

            const dataNoRBIChange = { ...baseNewData, rbi: "0" };

            await updateGameEvent({
                logId: "log1",
                newData: dataNoRBIChange,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "game_logs",
                "log1",
                expect.objectContaining({
                    baseState: expect.stringContaining("runnerResults"),
                }),
                mockClient,
            );
        });

        it("updates the log and game score without a transaction when RBI changes", async () => {
            // Old log has rbi: 0, new payload has rbi: "1" → delta = 1
            readDocument
                .mockResolvedValueOnce({ $id: "log1", gameId: "game1", rbi: 0 })
                .mockResolvedValueOnce({ $id: "game1", score: "3" });

            updateDocument
                .mockResolvedValueOnce({ $id: "game1" }) // game score updated first
                .mockResolvedValueOnce({ $id: "log1" }); // log updated second

            await updateGameEvent({
                logId: "log1",
                newData: baseNewData,
                client: mockClient,
            });

            expect(createTransaction).not.toHaveBeenCalled();
            // Score is updated first
            expect(updateDocument).toHaveBeenNthCalledWith(
                1,
                "games",
                "game1",
                { score: "4" },
                mockClient,
            );
        });

        it("updates the log directly without a transaction when RBI is unchanged", async () => {
            // Old log has rbi: 1, new payload has rbi: "1" → delta = 0
            readDocument.mockResolvedValueOnce({
                $id: "log1",
                gameId: "game1",
                rbi: 1,
            });
            updateDocument.mockResolvedValue({ $id: "log1" });

            await updateGameEvent({
                logId: "log1",
                newData: baseNewData,
                client: mockClient,
            });

            expect(createTransaction).not.toHaveBeenCalled();
            expect(updateDocument).toHaveBeenCalledWith(
                "game_logs",
                "log1",
                expect.any(Object),
                mockClient,
            );
        });

        it("rolls back the game score if the log update fails after the score was already updated", async () => {
            readDocument
                .mockResolvedValueOnce({ $id: "log1", gameId: "game1", rbi: 0 })
                .mockResolvedValueOnce({ $id: "game1", score: "3" });

            updateDocument
                .mockResolvedValueOnce({ $id: "game1" }) // game score update succeeds
                .mockRejectedValueOnce(new Error("DB write failed")) // log update fails
                .mockResolvedValueOnce({}); // score rollback succeeds

            const result = await updateGameEvent({
                logId: "log1",
                newData: baseNewData,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledTimes(3);
            expect(updateDocument).toHaveBeenLastCalledWith(
                "games",
                "game1",
                { score: "3" },
                mockClient,
            );
            expect(result.success).toBe(false);
        });

        it("returns an error if no client is provided", async () => {
            const result = await updateGameEvent({
                logId: "log1",
                newData: baseNewData,
                client: null,
            });
            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });

        it("updates the opponentScore when RBI changes on an opponent_run event", async () => {
            readDocument
                .mockResolvedValueOnce({
                    $id: "log1",
                    gameId: "game1",
                    eventType: "opponent_run",
                    rbi: 1,
                })
                .mockResolvedValueOnce({ $id: "game1", opponentScore: "4" });

            updateDocument
                .mockResolvedValueOnce({ $id: "game1" })
                .mockResolvedValueOnce({ $id: "log1" });

            const result = await updateGameEvent({
                logId: "log1",
                newData: {
                    ...baseNewData,
                    rbi: "3",
                    eventType: "opponent_run",
                },
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenNthCalledWith(
                1,
                "games",
                "game1",
                { opponentScore: "6" },
                mockClient,
            );
            expect(result.success).toBe(true);
        });

        it("handles type transition from team play to opponent_run play correctly adjusting both scores", async () => {
            readDocument
                .mockResolvedValueOnce({
                    $id: "log1",
                    gameId: "game1",
                    eventType: "single",
                    rbi: 1,
                })
                .mockResolvedValueOnce({
                    $id: "game1",
                    score: "4",
                    opponentScore: "2",
                });

            updateDocument
                .mockResolvedValueOnce({ $id: "game1" })
                .mockResolvedValueOnce({ $id: "log1" });

            const result = await updateGameEvent({
                logId: "log1",
                newData: {
                    ...baseNewData,
                    rbi: "3",
                    eventType: "opponent_run",
                },
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenNthCalledWith(
                1,
                "games",
                "game1",
                { score: "3", opponentScore: "5" },
                mockClient,
            );
            expect(result.success).toBe(true);
        });
    });
});
