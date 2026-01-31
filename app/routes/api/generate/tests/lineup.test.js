import { action } from "../lineup";
import { listDocuments } from "@/utils/databases";
import { createModel, parseAIResponse } from "@/utils/ai";
import { Query } from "node-appwrite";

jest.mock("@/utils/databases");
jest.mock("@/utils/ai");

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
    let mockGenerateContent;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset listDocuments to ensure no unconsumed mocks leak between tests
        listDocuments.mockReset();

        mockGenerateContent = jest.fn();
        createModel.mockReturnValue({
            generateContent: mockGenerateContent,
        });
        parseAIResponse.mockReturnValue({
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

            mockGenerateContent.mockResolvedValue({
                response: { text: () => "{}" },
            });

            await action({ request: req });

            const callArgs = mockGenerateContent.mock.calls[0][0];
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

            mockGenerateContent.mockResolvedValue({
                response: { text: () => "{}" },
            });

            await action({ request: req });

            const callArgs = mockGenerateContent.mock.calls[0][0];
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

            mockGenerateContent.mockResolvedValue({
                response: { text: () => "{}" },
            });

            const response = await action({ request: req });
            expect(response.status).toBe(200); // Process output even if logs fail
        });
    });

    describe("AI Response Validation", () => {
        const originalEnv = process.env;

        beforeEach(() => {
            // Force development env to get detailed error messages
            jest.resetModules(); // reset cache to ensure env read is fresh if needed (though locally scoped variable is fine)
            process.env = { ...originalEnv, NODE_ENV: "development" };

            // Setup valid calls for DB
            // We use history=[] so recentGameIds=[] and logs fetch is skipped,
            // consuming exactly 2 mocks per test.
            listDocuments
                .mockResolvedValueOnce({
                    rows: [{ $id: "curr", teamId: "t1" }],
                })
                .mockResolvedValueOnce({ rows: [] });

            mockGenerateContent.mockResolvedValue({
                response: { text: () => "{}" },
            });

            // Update parser mock to include bats
            parseAIResponse.mockReturnValue({
                lineup: [
                    {
                        $id: "p1",
                        firstName: "John",
                        lastName: "Doe",
                        gender: "M",
                        bats: "R",
                        positions: ["LF", "LF", "LF", "LF", "LF", "LF", "LF"],
                    },
                ],
                reasoning: "Test reasoning",
            });
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it("should throw/return 500 if AI parsing fails", async () => {
            parseAIResponse.mockReturnValueOnce(null);

            const response = await action({ request: createMockRequest() });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Failed to parse AI response");
        });

        it("should fail if duplicate IDs in generated lineup", async () => {
            parseAIResponse.mockReturnValueOnce({
                lineup: [
                    { $id: "p1", positions: Array(7).fill("LF") },
                    { $id: "p1", positions: Array(7).fill("RF") },
                ],
            });
            // Input has 2 players for this test
            const req = createMockRequest({
                players: [{ $id: "p1" }, { $id: "p2" }],
            });

            const response = await action({ request: req });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain("duplicate player IDs");
        });

        it("should fail if generated player IDs do not match input", async () => {
            parseAIResponse.mockReturnValueOnce({
                lineup: [{ $id: "p2", positions: Array(7).fill("LF") }], // p2 instead of p1
            });

            const response = await action({ request: createMockRequest() });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toMatch(/missing player|unknown player/);
        });

        it("should return success for valid lineup", async () => {
            // Default mocks in top beforeEach handle the happy path
            const response = await action({ request: createMockRequest() });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.lineup[0].$id).toBe("p1");
            expect(data.lineup[0].bats).toBe("R");
        });
    });
});
