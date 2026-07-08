import { listDocuments, readDocument, createDocument } from "@/utils/databases";

import {
    getUserById,
    getOrCreateUser,
    getAttendanceByUserId,
    getAwardsByUserId,
    getStatsByUserId,
    getAchievementsByUserId,
} from "../users";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
    createDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((attr, value) => `equal("${attr}", "${value}")`),
        orderDesc: jest.fn((attr) => `orderDesc("${attr}")`),
        limit: jest.fn((limit) => `limit(${limit})`),
        select: jest.fn(
            (attrs) => `select([${attrs.map((a) => `"${a}"`).join(", ")}])`,
        ),
        or: jest.fn((queries) => `or([${queries.join(",")}])`),
        contains: jest.fn((attr, value) => `contains("${attr}", "${value}")`),
    },
    Permission: {
        read: jest.fn((role) => `read("${role}")`),
        update: jest.fn((role) => `update("${role}")`),
        delete: jest.fn((role) => `delete("${role}")`),
    },
    Role: {
        any: jest.fn(() => "any"),
        user: jest.fn((id) => `user:${id}`),
    },
    Users: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
    })),
}));

describe("Users Loader", () => {
    const mockClient = { tablesDB: { id: "mock-session-db" } };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getStatsByUserId", () => {
        it("should return logs and games", async () => {
            const mockLogs = [
                { $id: "log1", gameId: "game1", eventType: "single" },
                { $id: "log2", gameId: "game1", eventType: "out" },
                { $id: "log3", gameId: "game2", eventType: "double" },
            ];
            const mockGames = [
                { $id: "game1", opponent: "Opponent A", teamId: "team1" },
                { $id: "game2", opponent: "Opponent B", teamId: "team2" },
            ];
            const mockTeams = [
                { $id: "team1", name: "Team A" },
                { $id: "team2", name: "Team B" },
            ];

            // Mock first call (logs)
            listDocuments.mockResolvedValueOnce({ rows: mockLogs });

            // Mock individual readDocument calls for games
            readDocument
                .mockResolvedValueOnce(mockGames[0])
                .mockResolvedValueOnce(mockGames[1]);

            // Mock individual readDocument calls for teams
            readDocument
                .mockResolvedValueOnce(mockTeams[0])
                .mockResolvedValueOnce(mockTeams[1]);

            const result = await getStatsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(listDocuments).toHaveBeenCalledWith(
                "game_logs",
                expect.arrayContaining([
                    expect.stringContaining(
                        'or([equal("playerId", "user1"),contains("scored", "user1")])',
                    ),
                    expect.stringContaining('orderDesc("$createdAt")'),
                    expect.stringContaining("limit(500)"),
                ]),
                mockClient,
            );

            // Check that we read ALL unique games individually
            expect(readDocument).toHaveBeenCalledWith(
                "games",
                "game1",
                expect.any(Array),
                mockClient,
            );
            expect(readDocument).toHaveBeenCalledWith(
                "games",
                "game2",
                expect.any(Array),
                mockClient,
            );

            // Check that we read ALL unique teams individually
            expect(readDocument).toHaveBeenCalledWith(
                "teams",
                "team1",
                expect.any(Array),
                mockClient,
            );
            expect(readDocument).toHaveBeenCalledWith(
                "teams",
                "team2",
                expect.any(Array),
                mockClient,
            );

            expect(result.userId).toEqual("user1");
            expect(result.logs).toEqual(mockLogs);
            expect(result.games).toEqual(mockGames);
            expect(result.teams).toEqual(mockTeams);
        });

        it("should handle multi-batch processing for large game sets", async () => {
            // Create 11 unique games (forcing 2 batches of 10)
            const manyLogs = Array.from({ length: 11 }, (_, i) => ({
                $id: `log${i}`,
                gameId: `game${i}`,
            }));
            const manyGames = manyLogs.map((log) => ({
                $id: log.gameId,
                teamId: "team1",
            }));

            listDocuments.mockResolvedValueOnce({ rows: manyLogs });
            manyGames.forEach((game) =>
                readDocument.mockResolvedValueOnce(game),
            );
            readDocument.mockResolvedValue({ $id: "team1", name: "Team 1" });

            const result = await getStatsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(result.games).toHaveLength(11);
            // Verify readDocument was called 11 times for games + 1 for team
            expect(readDocument).toHaveBeenCalledTimes(12);
        });

        it("should return empty arrays if no logs found", async () => {
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getStatsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(listDocuments).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                userId: "user1",
                logs: [],
                games: [],
                teams: [],
            });
        });
    });

    describe("getUserById", () => {
        it("should return user document", async () => {
            const mockUser = { $id: "user1", name: "Test User" };
            readDocument.mockResolvedValue(mockUser);

            const result = await getUserById({
                userId: "user1",
                client: mockClient,
            });

            expect(readDocument).toHaveBeenCalledWith(
                "users",
                "user1",
                [],
                mockClient,
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe("getOrCreateUser", () => {
        it("should return user document if it exists", async () => {
            const mockUser = { $id: "user1", name: "Test User" };
            readDocument.mockResolvedValue(mockUser);

            const result = await getOrCreateUser({
                userId: "user1",
                client: mockClient,
            });

            expect(readDocument).toHaveBeenCalledWith(
                "users",
                "user1",
                [],
                mockClient,
            );
            expect(result).toEqual(mockUser);
        });

        it("should self-heal and create user document if it does not exist", async () => {
            readDocument.mockRejectedValue({
                code: 404,
                message: "Document not found",
            });

            const testClient = {
                tablesDB: { id: "mock-session-db" },
                account: {
                    get: jest.fn().mockResolvedValue({
                        $id: "user1",
                        name: "Test User",
                        email: "test@example.com",
                    }),
                },
            };

            const mockCreatedDoc = {
                $id: "user1",
                userId: "user1",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                status: "verified",
            };
            createDocument.mockResolvedValue(mockCreatedDoc);

            const result = await getOrCreateUser({
                userId: "user1",
                client: testClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "users",
                "user1",
                expect.objectContaining({
                    userId: "user1",
                    email: "test@example.com",
                    firstName: "Test",
                    lastName: "User",
                    status: "verified",
                }),
                expect.any(Array),
                testClient,
            );
            expect(result).toEqual(mockCreatedDoc);
        });

        it("should re-read and return doc on 409 conflict during self-heal", async () => {
            // Simulate: first read returns 404 (doc missing), create returns 409
            // (another request created it concurrently), second read returns the doc.
            const existingDoc = {
                $id: "user1",
                userId: "user1",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                status: "verified",
            };

            readDocument
                .mockRejectedValueOnce({
                    code: 404,
                    message: "Document not found",
                })
                .mockResolvedValueOnce(existingDoc);

            createDocument.mockRejectedValue({
                code: 409,
                message: "Document already exists",
            });

            const testClient = {
                tablesDB: { id: "mock-session-db" },
                account: {
                    get: jest.fn().mockResolvedValue({
                        $id: "user1",
                        name: "Test User",
                        email: "test@example.com",
                    }),
                },
            };

            const result = await getOrCreateUser({
                userId: "user1",
                client: testClient,
            });

            expect(result).toEqual(existingDoc);
        });
    });

    describe("getAttendanceByUserId", () => {
        it("should return attendance documents", async () => {
            const mockAttendance = [{ $id: "att1", status: "accepted" }];
            listDocuments.mockResolvedValue({ rows: mockAttendance });

            const result = await getAttendanceByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(listDocuments).toHaveBeenCalledWith(
                "attendance",
                ['equal("playerId", "user1")', "limit(500)"],
                mockClient,
            );
            expect(result).toEqual(mockAttendance);
        });

        it("should return empty array if no documents", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const result = await getAttendanceByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(result).toEqual([]);
        });
    });

    describe("getAwardsByUserId", () => {
        it("should return awards documents", async () => {
            const mockAwards = [{ $id: "award1", name: "MVP" }];
            listDocuments.mockResolvedValue({ rows: mockAwards });

            const result = await getAwardsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(result).toEqual(mockAwards);
        });

        it("should return empty array if no documents", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const result = await getAwardsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(result).toEqual([]);
        });
    });

    describe("getAchievementsByUserId", () => {
        it("should return joined achievements documents", async () => {
            const mockUserAchievements = [
                { $id: "ua1", achievementId: "ach1", userId: "user1" },
            ];
            const mockBaseAchievements = [
                { $id: "ach1", name: "Multi HR Game", rarity: "rare" },
            ];

            // First call for user achievements, second call for base achievements
            listDocuments
                .mockResolvedValueOnce({ rows: mockUserAchievements })
                .mockResolvedValueOnce({ rows: mockBaseAchievements });

            const result = await getAchievementsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(listDocuments).toHaveBeenCalledWith(
                "user_achievements",
                ['equal("userId", "user1")', "limit(500)"],
                mockClient,
            );

            expect(listDocuments).toHaveBeenCalledWith(
                "achievements",
                ["limit(500)"],
                mockClient,
            );

            expect(result).toEqual([
                {
                    ...mockUserAchievements[0],
                    achievement: mockBaseAchievements[0],
                },
            ]);
        });

        it("should return empty array if no user achievements", async () => {
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getAchievementsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(result).toEqual([]);
        });
    });
});
