import { Query } from "node-appwrite";

import { listDocuments, updateDocument } from "@/utils/databases";
import { createModel, generateContentStream } from "@/utils/ai";

import { action } from "../lineup";

jest.mock("@/utils/databases");
jest.mock("@/utils/ai");

// Polyfill TextEncoder/TextDecoder for Jest if missing
if (typeof global.TextEncoder === "undefined") {
    const { TextEncoder, TextDecoder } = require("util");
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Polyfill ReadableStream for Jest test environments lacking it
if (typeof global.ReadableStream === "undefined") {
    // A simplified mock of ReadableStream for the test environment
    global.ReadableStream = class ReadableStream {
        constructor(underlyingSource) {
            this.underlyingSource = underlyingSource;
        }
    };
}

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(() => ({
        teams: {
            getPrefs: jest.fn().mockResolvedValue({ maxMaleBatters: 0 }),
        },
    })),
}));

// Mock Query manually since it's used in the file
jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((attr, val) => ({ method: "equal", attr, val })),
        isNotNull: jest.fn((attr) => ({ method: "isNotNull", attr })),
        limit: jest.fn((limit) => ({ method: "limit", limit })),
        select: jest.fn((attrs) => ({ method: "select", attrs })),
        orderDesc: jest.fn((attr) => ({ method: "orderDesc", attr })),
    },
    ID: { unique: jest.fn() },
}));

describe("lineup generation action", () => {
    let mockGenerateContentStream;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset listDocuments to ensure no unconsumed mocks leak between tests
        listDocuments.mockReset();
        updateDocument.mockReset(); // Reset update mock

        mockGenerateContentStream = jest.fn();

        // Mock generateContentStream to return an async iterator
        generateContentStream.mockImplementation(async function* () {
            yield JSON.stringify({
                lineup: [
                    {
                        $id: "p1",
                        firstName: "John",
                        lastName: "Doe",
                        gender: "M",
                        bats: "Right",
                        positions: ["LF", "LF", "LF", "LF", "LF", "LF", "LF"],
                    },
                ],
                reasoning: "Test reasoning",
            });
        });

        createModel.mockReturnValue({}); // No longer needs generateContent method
    });

    // Helper to create valid mock request
    const createMockRequest = (bodyOverrides = {}) => ({
        json: jest.fn().mockResolvedValue({
            players: [
                {
                    $id: "p1",
                    firstName: "John",
                    lastName: "Doe",
                    gender: "M",
                    bats: "Right",
                },
            ],
            team: { name: "Test Team", genderMix: "coed" },
            gameId: "current_game_id",
            ...bodyOverrides,
        }),
    });

    describe("Input Validation", () => {
        it("should return 400 if players array is missing", async () => {
            const req = createMockRequest({ players: null });
            const response = await action({ request: req });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toMatch(/players array is required/);
        });

        it("should return 400 if gameId is missing", async () => {
            const req = createMockRequest({ gameId: null });
            const response = await action({ request: req });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toMatch(/gameId is required/);
        });

        it("should return 403 if generation limit reached", async () => {
            listDocuments.mockResolvedValueOnce({
                rows: [{ $id: "g1", teamId: "t1", aiGenerationCount: 3 }],
            });

            const req = createMockRequest();
            const response = await action({ request: req });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toMatch(/limit reached/);
        });

        it("should increment generation count on success", async () => {
            // Mock game fetch (count 0)
            listDocuments.mockResolvedValueOnce({
                rows: [{ $id: "g1", teamId: "t1", aiGenerationCount: 0 }],
            });
            // Mock games fetch for stats (empty is fine)
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const req = createMockRequest();
            await action({ request: req });

            expect(updateDocument).toHaveBeenCalledWith("games", "g1", {
                aiGenerationCount: 1,
            });
        });
        it("should rollback generation count on failure after increment", async () => {
            const req = createMockRequest();
            const originalCount = 1;

            // 1. Get Game (success)
            listDocuments.mockResolvedValueOnce({
                rows: [
                    {
                        $id: "curr",
                        teamId: "t1",
                        aiGenerationCount: originalCount,
                    },
                ],
            });

            // 2. History Fetch (Fail) to trigger rollback
            listDocuments.mockRejectedValueOnce(
                new Error("History Fetch Failed"),
            );

            // Mock updateDocument success for the increment
            updateDocument.mockResolvedValue({});

            const response = await action({ request: req });

            // Expect failure response
            expect(response.status).toBe(500);

            // Verify increment was called
            expect(updateDocument).toHaveBeenCalledWith("games", "curr", {
                aiGenerationCount: originalCount + 1,
            });

            // Verify rollback was called
            expect(updateDocument).toHaveBeenCalledWith("games", "curr", {
                aiGenerationCount: originalCount,
            });
        });
    });

    describe("Game Context Validation", () => {
        it("should return 404 if game is not found", async () => {
            listDocuments.mockResolvedValueOnce({ rows: [] }); // Step 1: Get Game

            const response = await action({ request: createMockRequest() });
            expect(response.status).toBe(404);
        });

        it("should return 404 if game missing teamId", async () => {
            listDocuments.mockResolvedValueOnce({
                rows: [{ $id: "g1", teamId: null }],
            });

            const response = await action({ request: createMockRequest() });
            expect(response.status).toBe(404);
        });
    });

    describe("Historical Data Processing", () => {
        it("should filter and parse previous games", async () => {
            const req = createMockRequest();
            listDocuments
                .mockResolvedValueOnce({
                    rows: [{ $id: "curr", teamId: "t1" }],
                }) // Current Game
                .mockResolvedValueOnce({
                    rows: [
                        { $id: "g1", result: "W", playerChart: "[]" }, // Empty lineup -> skip
                        { $id: "g2", result: null }, // No result -> skip
                        {
                            $id: "g3",
                            result: "L",
                            playerChart: JSON.stringify([{ $id: "p1" }]),
                            score: 10,
                            opponentScore: 12,
                        }, // Valid
                    ],
                }) // History
                .mockResolvedValueOnce({ rows: [] }); // Stats

            await action({ request: req });

            const callArgs = generateContentStream.mock.calls[0][1];
            const inputData = JSON.parse(callArgs[1].text);

            expect(inputData.history).toHaveLength(1);
            expect(inputData.history[0].l).toEqual(["p1"]); // Only g3 made it
        });
    });

    describe("Stats & Event Integration", () => {
        it("should map events and append descriptions", async () => {
            const req = createMockRequest();
            listDocuments
                .mockResolvedValueOnce({
                    rows: [{ $id: "curr", teamId: "t1" }],
                })
                .mockResolvedValueOnce({
                    rows: [
                        {
                            $id: "recent_game",
                            result: "W",
                            playerChart: JSON.stringify([{ $id: "p1" }]),
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    rows: [
                        {
                            gameId: "recent_game",
                            playerId: "p1",
                            eventType: "homerun",
                            description: "deep center",
                            rbi: 2,
                        },
                        {
                            gameId: "recent_game",
                            playerId: "p1",
                            eventType: "fielders_choice",
                            rbi: 1,
                        },
                        {
                            gameId: "recent_game",
                            playerId: "p1",
                            eventType: "unknown_event_type",
                        },
                    ],
                });

            await action({ request: req });

            const callArgs = generateContentStream.mock.calls[0][1];
            const inputData = JSON.parse(callArgs[1].text);

            expect(inputData.history[0].stats.p1).toContain(
                "HR(deep center, RBI:2)",
            );
            expect(inputData.history[0].stats.p1).toContain("FC(RBI:1)");
            expect(inputData.history[0].stats.p1).not.toContain(
                "unknown_event_type",
            );

            // Verify History Query
            expect(Query.equal).toHaveBeenCalledWith("teamId", "t1");
            expect(Query.limit).toHaveBeenCalledWith(20);
            expect(Query.orderDesc).toHaveBeenCalledWith("gameDate");

            // Verify Query.select usage
            expect(Query.select).toHaveBeenCalledWith([
                "gameId",
                "playerId",
                "eventType",
                "description",
                "rbi",
            ]);

            // Verify 'bats' is included in available players
            expect(inputData.availablePlayers[0].b).toBeDefined();
        });

        it("should gracefully handle log fetch failure", async () => {
            const req = createMockRequest();
            listDocuments
                .mockResolvedValueOnce({
                    rows: [{ $id: "curr", teamId: "t1" }],
                })
                .mockResolvedValueOnce({
                    rows: [
                        {
                            $id: "g1",
                            result: "W",
                            playerChart: JSON.stringify([{ $id: "p1" }]),
                        },
                    ],
                })
                .mockRejectedValueOnce(new Error("Appwrite Error"));

            const response = await action({ request: req });
            expect(response.status).toBe(200); // Process output even if logs fail
            expect(generateContentStream).toHaveBeenCalled();
        });
    });

    describe("Streaming Behavior", () => {
        beforeEach(() => {
            // Setup default mocks for happy path to reach streaming phase
            listDocuments.mockImplementation(async () => ({
                rows: [
                    {
                        $id: "g1",
                        teamId: "t1",
                        result: "W",
                        playerChart: "[]",
                        score: "10",
                        opponentScore: "5",
                        gameDate: "2023-01-01",
                    },
                ],
                total: 1,
            }));
        });

        it("should return a Responsive with a ReadableStream that iterates over content", async () => {
            const req = createMockRequest();
            const response = await action({ request: req });

            // Verify response headers
            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toBe(
                "text/plain; charset=utf-8",
            );

            // Verify stream construction
            const body = response.body;
            expect(body).toBeDefined();
            expect(body.underlyingSource).toBeDefined();
            expect(body.underlyingSource.start).toBeDefined();

            // Verify streaming logic
            const mockController = {
                enqueue: jest.fn(),
                close: jest.fn(),
                error: jest.fn(),
            };

            await body.underlyingSource.start(mockController);

            expect(generateContentStream).toHaveBeenCalled();
            expect(mockController.enqueue).toHaveBeenCalled();
            expect(mockController.close).toHaveBeenCalled();
        });

        it("should handle streaming errors by enqueuing error JSON if nothing sent yet", async () => {
            // Mock error
            generateContentStream.mockImplementation(async function* () {
                throw new Error("Stream failed");
            });

            const req = createMockRequest();
            const response = await action({ request: req });
            const body = response.body;

            const mockController = {
                enqueue: jest.fn(),
                close: jest.fn(),
                error: jest.fn(),
            };

            await body.underlyingSource.start(mockController);

            expect(mockController.enqueue).toHaveBeenCalled();

            // Verify error payload
            const callArg = mockController.enqueue.mock.calls[0][0];
            const text = new TextDecoder().decode(callArg);
            expect(text).toContain("Failed to generate lineup");
            expect(mockController.close).toHaveBeenCalled();

            // Verify rollback happened
            // 1. Increment call (g1 comes from beforeEach mock, aiGenerationCount default 0 -> 1)
            expect(updateDocument).toHaveBeenCalledWith(
                "games",
                "g1",
                expect.objectContaining({ aiGenerationCount: 1 }),
            );
            // 2. Rollback call (back to 0)
            expect(updateDocument).toHaveBeenLastCalledWith("games", "g1", {
                aiGenerationCount: 0,
            });
        });

        it("should handle streaming errors by calling error() if data already sent", async () => {
            generateContentStream.mockImplementation(async function* () {
                yield "some data";
                // Yielding implicitly happens, then we throw
                throw new Error("Stream failed mid-way");
            });

            const req = createMockRequest();
            const response = await action({ request: req });
            const body = response.body;

            const mockController = {
                enqueue: jest.fn(),
                close: jest.fn(),
                error: jest.fn(),
            };

            await body.underlyingSource.start(mockController);

            // Expected: enqueue data, then error
            expect(mockController.enqueue).toHaveBeenCalled();
            const callArg = mockController.enqueue.mock.calls[0][0];
            const text = new TextDecoder().decode(callArg);
            expect(text).toBe("some data");

            expect(mockController.error).toHaveBeenCalledWith(
                expect.any(Error),
            );
        });
    });
});
