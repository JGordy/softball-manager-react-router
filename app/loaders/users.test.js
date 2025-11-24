import {
    getUserById,
    getTeamsByUserId,
    getAttendanceByUserId,
    getAwardsByUserId,
} from "./users";
import { listDocuments, readDocument } from "@/utils/databases";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(),
    },
}));

describe("Users Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

    describe("getTeamsByUserId", () => {
        it("should return teams for the user", async () => {
            const mockMemberships = [{ teamId: "team1" }, { teamId: "team2" }];
            const mockTeams = [
                { $id: "team1", name: "Team 1" },
                { $id: "team2", name: "Team 2" },
            ];

            listDocuments.mockResolvedValueOnce({ rows: mockMemberships }); // memberships
            listDocuments.mockResolvedValueOnce({ rows: mockTeams }); // teams batch query

            const result = await getTeamsByUserId({ userId: "user1" });

            expect(result).toHaveLength(2);
            expect(result).toEqual(mockTeams);
        });

        it("should return empty array if no memberships", async () => {
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getTeamsByUserId({ userId: "user1" });

            expect(result).toEqual([]);
        });
    });

    describe("getAttendanceByUserId", () => {
        it("should return attendance documents", async () => {
            const mockAttendance = [{ $id: "att1", status: "accepted" }];
            listDocuments.mockResolvedValue({ rows: mockAttendance });

            const result = await getAttendanceByUserId({ userId: "user1" });

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
