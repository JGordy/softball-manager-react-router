import { getUserTeams, getTeamById } from "./teams";
import { listDocuments, readDocument } from "@/utils/databases";
import { createSessionClient } from "@/utils/appwrite/server";
import { Query } from "node-appwrite";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(),
    },
}));

describe("Teams Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("getUserTeams", () => {
        it("should return empty arrays if user is not authenticated", async () => {
            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockResolvedValue(null) },
            });

            const result = await getUserTeams({ request: {} });

            expect(result).toEqual({ managing: [], playing: [], userId: null });
        });

        it("should return managing and playing teams", async () => {
            const mockUser = { $id: "user1" };
            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockResolvedValue(mockUser) },
            });

            const mockMemberships = [
                { role: "manager", teamId: "team1" },
                { role: "player", teamId: "team2" },
            ];
            listDocuments.mockResolvedValueOnce({ rows: mockMemberships }); // memberships

            const mockManagerTeams = [{ $id: "team1", name: "Team 1" }];
            const mockPlayerTeams = [{ $id: "team2", name: "Team 2" }];

            // Mock the batch fetch calls
            listDocuments
                .mockResolvedValueOnce({ rows: mockManagerTeams }) // manager teams
                .mockResolvedValueOnce({ rows: [] }) // seasons for manager team
                .mockResolvedValueOnce({ rows: mockPlayerTeams }) // player teams
                .mockResolvedValueOnce({ rows: [] }); // seasons for player team

            const result = await getUserTeams({ request: {} });

            expect(result.userId).toBe("user1");
            expect(result.managing).toEqual(mockManagerTeams);
            expect(result.playing).toEqual(mockPlayerTeams);
        });
    });

    describe("getTeamById", () => {
        it("should return team data, players, and managerIds", async () => {
            const mockMemberships = [
                { userId: "user1", role: "manager", teamId: "team1" },
                { userId: "user2", role: "player", teamId: "team1" },
            ];
            const mockUsers = [
                { $id: "user1", name: "Manager" },
                { $id: "user2", name: "Player" },
            ];
            const mockTeamData = {
                $id: "team1",
                name: "Team 1",
                seasons: [{ games: [{ $id: "game1" }] }],
            };

            const mockSeasons = [{ $id: "season1", teamId: "team1" }];
            const mockGames = [{ $id: "game1", seasonId: "season1" }];

            listDocuments.mockResolvedValueOnce({ rows: mockMemberships }); // memberships
            listDocuments.mockResolvedValueOnce({ rows: mockUsers }); // users
            listDocuments.mockResolvedValueOnce({ rows: mockSeasons }); // seasons
            listDocuments.mockResolvedValueOnce({ rows: mockGames }); // games for season
            readDocument.mockResolvedValueOnce(mockTeamData); // team data

            const result = await getTeamById({ teamId: "team1" });

            expect(result.teamData.$id).toBe("team1");
            expect(result.managerIds).toContain("user1");
            expect(result.players).toHaveLength(2);
            expect(result.teamData.seasons[0].games[0].teamName).toBe("Team 1");
            // Batch query uses array of season IDs
            expect(Query.equal).toHaveBeenCalledWith("seasonId", ["season1"]);
        });

        it("should return empty object if teamId is missing", async () => {
            const result = await getTeamById({ teamId: null });
            expect(result).toEqual({ teamData: {} });
        });
    });
});
