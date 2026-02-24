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

            const mockManagerTeams = [
                { $id: "team1", name: "Team 1", seasons: [] },
            ];
            const mockPlayerTeams = [
                { $id: "team2", name: "Team 2", seasons: [] },
            ];

            // Mock the batch fetch calls for database teams
            listDocuments
                .mockResolvedValueOnce({ rows: mockManagerTeams }) // manager teams from DB
                .mockResolvedValueOnce({ rows: [] }) // seasons for manager team
                .mockResolvedValueOnce({ rows: mockPlayerTeams }) // player teams from DB
                .mockResolvedValueOnce({ rows: [] }); // seasons for player team

            const result = await getUserTeams({ request: {} });

            expect(result.userId).toBe("user1");
            expect(result.managing).toEqual(mockManagerTeams);
            expect(result.playing).toEqual(mockPlayerTeams);
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

            // Mock DB calls in order:
            // 1. fetchTeams (manager): teams list
            // 2. fetchTeams (manager): seasons list
            // 3. fetchTeams (manager): past games
            // 4. fetchTeams (manager): future games
            // 5. stats: awards list
            // 6. stats: game_logs list
            listDocuments
                .mockResolvedValueOnce({
                    rows: [{ $id: "team1", name: "Team 1" }],
                }) // manager teams
                .mockResolvedValueOnce({
                    rows: [{ $id: "season1", teamId: "team1" }],
                }) // seasons
                .mockResolvedValueOnce({ rows: [] }) // past games
                .mockResolvedValueOnce({ rows: [] }) // future games
                .mockResolvedValueOnce({ total: 5 }) // awards count
                .mockResolvedValueOnce({ total: 10 }); // game logs count

            const result = await getUserTeams({
                request: {},
                isDashboard: true,
            });

            expect(result.stats).toEqual({
                awardsCount: 5,
                gameCount: 10,
                teamCount: 1, // 1 manager team + 0 player teams
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
                    getPrefs: jest
                        .fn()
                        .mockResolvedValue({ maxMaleBatters: 3 }),
                },
            });

            listDocuments.mockResolvedValueOnce({ rows: mockUsers }); // users
            readDocument.mockResolvedValueOnce(mockTeamData); // team data
            listDocuments.mockResolvedValueOnce({ rows: mockSeasons }); // seasons
            listDocuments.mockResolvedValueOnce({ rows: mockGames }); // games
            listDocuments.mockResolvedValueOnce({ rows: [] }); // game logs

            const result = await getTeamById({
                teamId: "team1",
                request: {},
            });

            expect(result.teamData.$id).toBe("team1");
            expect(result.teamData.displayName).toBe("T1");
            expect(result.teamData.prefs).toEqual({ maxMaleBatters: 3 });
            expect(result.managerIds).toContain("user1");
            expect(result.players).toHaveLength(2);
            expect(result.teamData.seasons[0].games[0].displayName).toBe("T1");
        });

        it("should return empty object if teamId is missing", async () => {
            const result = await getTeamById({ teamId: null, request: {} });
            expect(result).toEqual({ teamData: {} });
        });
    });
});
