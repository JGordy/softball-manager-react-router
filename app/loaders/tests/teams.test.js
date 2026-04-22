import { listDocuments, readDocument } from "@/utils/databases";

import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";

import { getUserTeams, getTeamById } from "../teams";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
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

            const result = await getUserTeams({
                client: await createSessionClient(),
            });

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
                            memberships: [
                                {
                                    userId: "user1",
                                    roles: ["owner", "manager"],
                                },
                            ],
                        })
                        .mockResolvedValueOnce({
                            memberships: [
                                { userId: "user1", roles: ["player"] },
                            ],
                        }),
                },
            });

            const mockManagerTeam = { $id: "team1", name: "Team 1" };
            const mockPlayerTeam = { $id: "team2", name: "Team 2" };

            // Mock individual readDocument calls for teams
            readDocument
                .mockResolvedValueOnce(mockManagerTeam)
                .mockResolvedValueOnce(mockPlayerTeam);

            // Mock listDocuments calls for seasons (called once per fetchTeams call)
            listDocuments
                .mockResolvedValueOnce({ rows: [] }) // seasons for manager team
                .mockResolvedValueOnce({ rows: [] }); // seasons for player team

            const result = await getUserTeams({
                client: await createSessionClient(),
            });

            expect(result.userId).toBe("user1");
            expect(result.managing[0].$id).toBe("team1");
            expect(result.playing[0].$id).toBe("team2");
        });

        it("should return stats when isDashboard is true", async () => {
            const mockUser = { $id: "user1" };
            const mockTeams = {
                teams: [{ $id: "team1", name: "Team 1" }],
            };

            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockResolvedValue(mockUser) },
                teams: {
                    list: jest.fn().mockResolvedValue(mockTeams),
                    listMemberships: jest.fn().mockResolvedValue({
                        memberships: [{ userId: "user1", roles: ["owner"] }],
                    }),
                },
            });

            // 1. readDocument (manager team)
            readDocument.mockResolvedValueOnce({
                $id: "team1",
                name: "Team 1",
                displayName: "T1",
            });
            // 2. listDocuments (seasons)
            listDocuments.mockResolvedValueOnce({
                rows: [{ $id: "season1", teamId: "team1" }],
            });
            // 3. listDocuments (past games)
            listDocuments.mockResolvedValueOnce({ rows: [] });
            // 4. listDocuments (future games)
            listDocuments.mockResolvedValueOnce({ rows: [] });
            // 5. listDocuments (awards count)
            listDocuments.mockResolvedValueOnce({ total: 5 });
            // 6. listDocuments (game logs count)
            listDocuments.mockResolvedValueOnce({ total: 10 });

            const result = await getUserTeams({
                client: await createSessionClient(),
                isDashboard: true,
            });

            expect(result.stats).toEqual({
                awardsCount: 5,
                gameCount: 10,
                teamCount: 1,
            });
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
                displayName: "T1",
            };
            const mockSeasons = [{ $id: "season1", teamId: "team1" }];
            const mockGames = [{ $id: "game1", seasonId: "season1" }];

            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: jest
                        .fn()
                        .mockResolvedValue(mockMemberships),
                    getPrefs: jest.fn().mockResolvedValue({
                        maxMaleBatters: 3,
                        jerseyNumbers: { user1: "10" },
                    }),
                },
            });

            // ORDER:
            // 1. listDocuments (users)
            listDocuments.mockResolvedValueOnce({ rows: mockUsers });
            // 2. readDocument (team data)
            readDocument.mockResolvedValueOnce(mockTeamData);
            // 3. listDocuments (seasons)
            listDocuments.mockResolvedValueOnce({ rows: mockSeasons });
            // 4. listDocuments (games)
            listDocuments.mockResolvedValueOnce({ rows: mockGames });
            // 5. listDocuments (game logs)
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getTeamById({
                teamId: "team1",
                client: await createSessionClient(),
            });

            expect(result.teamData.$id).toBe("team1");
            expect(result.teamData.displayName).toBe("T1");
            expect(result.teamData.prefs.jerseyNumbers).toEqual({
                user1: "10",
            });
            expect(result.managerIds).toContain("user1");
            expect(result.players).toHaveLength(2);
            expect(
                result.players.find((p) => p.$id === "user1").jerseyNumber,
            ).toBe("10");
            expect(
                result.players.find((p) => p.$id === "user2").jerseyNumber,
            ).toBe(null);
            expect(result.teamData.seasons[0].games[0].displayName).toBe("T1");
        });

        it("should return empty object if teamId is missing", async () => {
            const result = await getTeamById({
                teamId: null,
                client: await createSessionClient(),
            });
            expect(result).toEqual({ teamData: {} });
        });
    });
});
