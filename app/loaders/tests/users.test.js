import { listDocuments, readDocument } from "@/utils/databases";

import {
    getUserById,
    getAttendanceByUserId,
    getAwardsByUserId,
    getStatsByUserId,
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
            listDocuments.mockImplementationOnce(() =>
                Promise.resolve({ rows: mockLogs }),
            );
            // Mock second call (games)
            listDocuments.mockImplementationOnce(() =>
                Promise.resolve({ rows: mockGames }),
            );
            // Mock third call (teams)
            listDocuments.mockImplementationOnce(() =>
                Promise.resolve({ rows: mockTeams }),
            );

            const result = await getStatsByUserId({ userId: "user1" });

            expect(listDocuments).toHaveBeenNthCalledWith(
                1,
                "game_logs",
                expect.arrayContaining([
                    Query.equal("playerId", "user1"),
                    Query.orderDesc("$createdAt"),
                ]),
            );

            // Check that we requested the correct game IDs
            expect(listDocuments).toHaveBeenNthCalledWith(
                2,
                "games",
                expect.arrayContaining([
                    Query.equal("$id", ["game1", "game2"]),
                ]),
            );

            // Check that we requested the correct team IDs
            expect(listDocuments).toHaveBeenNthCalledWith(
                3,
                "teams",
                expect.arrayContaining([
                    Query.equal("$id", ["team1", "team2"]),
                ]),
            );

            expect(result).toEqual({
                logs: mockLogs,
                games: mockGames,
                teams: mockTeams,
            });
        });

        it("should return empty arrays if no logs found", async () => {
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getStatsByUserId({ userId: "user1" });

            expect(listDocuments).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ logs: [], games: [], teams: [] });
        });
    });

    describe("getUserById", () => {
        it("should return user document", async () => {
            const mockUser = { $id: "user1", name: "Test User" };
            readDocument.mockResolvedValue(mockUser);

            const result = await getUserById({ userId: "user1" });

            expect(readDocument).toHaveBeenCalledWith("users", "user1");
            expect(result).toEqual(mockUser);
        });
    });

    describe("getAttendanceByUserId", () => {
        it("should return attendance documents", async () => {
            const mockAttendance = [{ $id: "att1", status: "accepted" }];
            listDocuments.mockResolvedValue({ rows: mockAttendance });

            const result = await getAttendanceByUserId({ userId: "user1" });

            expect(listDocuments).toHaveBeenCalledWith("attendance", [
                'equal("playerId", "user1")',
                "limit(100)",
            ]);
            expect(result).toEqual(mockAttendance);
        });

        it("should return empty array if no documents", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const result = await getAttendanceByUserId({ userId: "user1" });

            expect(result).toEqual([]);
        });
    });

    describe("getAwardsByUserId", () => {
        it("should return awards documents", async () => {
            const mockAwards = [{ $id: "award1", name: "MVP" }];
            listDocuments.mockResolvedValue({ rows: mockAwards });

            const result = await getAwardsByUserId({ userId: "user1" });

            expect(result).toEqual(mockAwards);
        });

        it("should return empty array if no documents", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const result = await getAwardsByUserId({ userId: "user1" });

            expect(result).toEqual([]);
        });
    });
});
