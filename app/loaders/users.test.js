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
            const mockTeam1 = [{ $id: "team1", name: "Team 1" }];
            const mockTeam2 = [{ $id: "team2", name: "Team 2" }];

            listDocuments.mockResolvedValueOnce({ documents: mockMemberships }); // memberships
            listDocuments
                .mockResolvedValueOnce({ documents: mockTeam1 }) // team 1
                .mockResolvedValueOnce({ documents: mockTeam2 }); // team 2

            const result = await getTeamsByUserId({ userId: "user1" });

            expect(result).toHaveLength(2);
            expect(result).toEqual([...mockTeam1, ...mockTeam2]);
        });

        it("should return empty array if no memberships", async () => {
            listDocuments.mockResolvedValueOnce({ documents: [] });

            const result = await getTeamsByUserId({ userId: "user1" });

            expect(result).toEqual([]);
        });
    });

    describe("getAttendanceByUserId", () => {
        it("should return attendance documents", async () => {
            const mockAttendance = [{ $id: "att1", status: "accepted" }];
            listDocuments.mockResolvedValue({ documents: mockAttendance });

            const result = await getAttendanceByUserId({ userId: "user1" });

            expect(result).toEqual(mockAttendance);
        });

        it("should return empty array if no documents", async () => {
            listDocuments.mockResolvedValue({ documents: [] });

            const result = await getAttendanceByUserId({ userId: "user1" });

            expect(result).toEqual([]);
        });
    });

    describe("getAwardsByUserId", () => {
        it("should return awards documents", async () => {
            const mockAwards = [{ $id: "award1", name: "MVP" }];
            listDocuments.mockResolvedValue({ documents: mockAwards });

            const result = await getAwardsByUserId({ userId: "user1" });

            expect(result).toEqual(mockAwards);
        });

        it("should return empty array if no documents", async () => {
            listDocuments.mockResolvedValue({ documents: [] });

            const result = await getAwardsByUserId({ userId: "user1" });

            expect(result).toEqual([]);
        });
    });
});
