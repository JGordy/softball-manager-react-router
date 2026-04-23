import { listDocuments, readDocument } from "@/utils/databases";

import {
    getUserById,
    getAttendanceByUserId,
    getAwardsByUserId,
    getStatsByUserId,
    getAchievementsByUserId,
} from "../users";
import { Query } from "node-appwrite";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((attr, value) => `equal("${attr}", "${value}")`),
        orderDesc: jest.fn((attr) => `orderDesc("${attr}")`),
        limit: jest.fn((limit) => `limit(${limit})`),
        select: jest.fn(
            (attrs) => `select([${attrs.map((a) => `"${a}"`).join(", ")}])`,
        ),
    },
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
                    Query.equal("playerId", "user1"),
                    Query.orderDesc("$createdAt"),
                ]),
                mockClient,
            );

            // Check that we read the games
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

            // Check that we read the teams
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

            expect(result.logs).toEqual(mockLogs);
            expect(result.games).toEqual(mockGames);
            expect(result.teams).toEqual(mockTeams);
        });

        it("should return empty arrays if no logs found", async () => {
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getStatsByUserId({
                userId: "user1",
                client: mockClient,
            });

            expect(listDocuments).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ logs: [], games: [], teams: [] });
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
