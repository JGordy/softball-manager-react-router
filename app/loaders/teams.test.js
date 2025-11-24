import { getUserTeams, getTeamById } from "./teams";
import { listDocuments, readDocument } from "@/utils/databases";
import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";
import { Query } from "node-appwrite";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(),
        limit: jest.fn(),
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
                teams: { list: jest.fn() },
            });

            const result = await getUserTeams({ request: {} });

            expect(result).toEqual({ managing: [], playing: [], userId: null });
        });

        it("should return teams from Appwrite Teams API", async () => {
            const mockUser = { $id: "user1" };
            const mockTeams = {
                teams: [
                    { $id: "team1", name: "Team 1" },
                    { $id: "team2", name: "Team 2" },
                ],
            };

            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockResolvedValue(mockUser) },
                teams: {
                    list: jest.fn().mockResolvedValue(mockTeams),
                    listMemberships: jest
                        .fn()
                        .mockResolvedValueOnce({
                            // team1 - user is manager
                            memberships: [
                                {
                                    userId: "user1",
                                    roles: ["owner", "manager"],
                                },
                            ],
                        })
                        .mockResolvedValueOnce({
                            // team2 - user is player
                            memberships: [
                                { userId: "user1", roles: ["player"] },
                            ],
                        }),
                },
            });

            const mockManagerTeams = [{ $id: "team1", name: "Team 1" }];
            const mockPlayerTeams = [{ $id: "team2", name: "Team 2" }];

            // Mock the batch fetch calls for database teams
            listDocuments
                .mockResolvedValueOnce({ rows: [] }) // old memberships (empty)
                .mockResolvedValueOnce({ rows: mockManagerTeams }) // manager teams from DB
                .mockResolvedValueOnce({ rows: [] }) // seasons for manager team
                .mockResolvedValueOnce({ rows: mockPlayerTeams }) // player teams from DB
                .mockResolvedValueOnce({ rows: [] }); // seasons for player team

            const result = await getUserTeams({ request: {} });

            expect(result.userId).toBe("user1");
            expect(result.managing).toEqual(mockManagerTeams);
            expect(result.playing).toEqual(mockPlayerTeams);
        });

        it("should fallback to old memberships table if Teams API fails", async () => {
            const mockUser = { $id: "user1" };

            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockResolvedValue(mockUser) },
                teams: {
                    list: jest
                        .fn()
                        .mockRejectedValue(new Error("Teams API error")),
                },
            });

            const mockMemberships = [
                { role: "manager", teamId: "team1", userId: "user1" },
                { role: "player", teamId: "team2", userId: "user1" },
            ];
            const mockManagerTeams = [{ $id: "team1", name: "Team 1" }];
            const mockPlayerTeams = [{ $id: "team2", name: "Team 2" }];

            listDocuments
                .mockResolvedValueOnce({ rows: mockMemberships }) // old memberships
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
        it("should return team data from Appwrite Teams API", async () => {
            const mockMemberships = {
                memberships: [
                    {
                        userId: "user1",
                        roles: ["owner", "manager"],
                        $id: "membership1",
                    },
                    { userId: "user2", roles: ["player"], $id: "membership2" },
                ],
            };
            const mockUsers = [
                { $id: "user1", name: "Manager" },
                { $id: "user2", name: "Player" },
            ];
            const mockTeamData = {
                $id: "team1",
                name: "Team 1",
            };
            const mockSeasons = [{ $id: "season1", teamId: "team1" }];
            const mockGames = [{ $id: "game1", seasonId: "season1" }];

            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: jest
                        .fn()
                        .mockResolvedValue(mockMemberships),
                },
            });

            listDocuments.mockResolvedValueOnce({ rows: mockUsers }); // users
            readDocument.mockResolvedValueOnce(mockTeamData); // team data
            listDocuments.mockResolvedValueOnce({ rows: mockSeasons }); // seasons
            listDocuments.mockResolvedValueOnce({ rows: mockGames }); // games

            const result = await getTeamById({
                teamId: "team1",
                request: {},
            });

            expect(result.teamData.$id).toBe("team1");
            expect(result.managerIds).toContain("user1");
            expect(result.players).toHaveLength(2);
        });

        it("should fallback to old memberships table if Teams API fails", async () => {
            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: jest
                        .fn()
                        .mockRejectedValue(new Error("Teams API error")),
                },
            });

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
            };
            const mockSeasons = [{ $id: "season1", teamId: "team1" }];
            const mockGames = [{ $id: "game1", seasonId: "season1" }];

            listDocuments.mockResolvedValueOnce({ rows: mockMemberships }); // old memberships
            listDocuments.mockResolvedValueOnce({ rows: mockUsers }); // users
            readDocument.mockResolvedValueOnce(mockTeamData); // team data
            listDocuments.mockResolvedValueOnce({ rows: mockSeasons }); // seasons
            listDocuments.mockResolvedValueOnce({ rows: mockGames }); // games

            const result = await getTeamById({
                teamId: "team1",
                request: {},
            });

            expect(result.teamData.$id).toBe("team1");
            expect(result.managerIds).toContain("user1");
            expect(result.players).toHaveLength(2);
        });

        it("should return empty object if teamId is missing", async () => {
            const result = await getTeamById({ teamId: null, request: {} });
            expect(result).toEqual({ teamData: {} });
        });
    });
});
