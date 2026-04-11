import { listDocuments, readDocument } from "@/utils/databases";

import { getEventById, getEventWithPlayerCharts } from "../games";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
    createSessionClient: jest.fn(),
}));

import { createAdminClient } from "@/utils/appwrite/server";

// Mock global fetch for weather API
global.fetch = jest.fn();

describe("Games Loader", () => {
    const mockSessionClient = { tablesDB: { id: "mock-session-db" } };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
        const { createSessionClient } = require("@/utils/appwrite/server");
        createSessionClient.mockResolvedValue(mockSessionClient);

        // Default mock for admin client to avoid issues with resolvePlayers enrichment
        createAdminClient.mockReturnValue({
            users: {
                list: jest.fn().mockResolvedValue({ users: [], total: 0 }),
            },
            teams: {
                getPrefs: jest.fn().mockResolvedValue({}),
                listMemberships: jest
                    .fn()
                    .mockResolvedValue({ memberships: [] }),
            },
        });

        // Default mock for fetch to prevent errors
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });
    });

    afterEach(() => {
        console.error.mockRestore();
        console.warn.mockRestore();
    });

    describe("getEventById", () => {
        it("should return gameDeleted: true if game is not found", async () => {
            readDocument.mockRejectedValue({ code: 404 });

            const result = await getEventById({
                eventId: "missing",
                client: mockSessionClient,
            });

            expect(result.gameDeleted).toBe(true);
            expect(result.game).toBeNull();
        });

        it("should return game data and deferred promises on success", async () => {
            const mockGame = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(JSON.stringify({ lineup: [] })),
                seasons: "season1",
            };
            const mockSeason = {
                $id: "season1",
                teams: ["team1"],
                parkId: "park1",
            };
            const mockTeams = [{ $id: "team1", name: "Team 1" }];

            // Mock Teams API for memberships
            const mockListMemberships = jest.fn().mockResolvedValue({
                memberships: [{ userId: "user1", roles: ["owner", "manager"] }],
            });
            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: mockListMemberships,
                    getPrefs: jest.fn().mockResolvedValue({}),
                },
            });

            // Mock for loadGameBase
            readDocument.mockResolvedValueOnce(mockGame); // game
            readDocument.mockResolvedValueOnce(mockSeason); // season

            // Mock for teams query and deferred data queries (users, attendance, awards, votes)
            listDocuments.mockResolvedValue({ rows: mockTeams });

            // Mock for getWeatherData
            readDocument.mockResolvedValue({ latitude: 0, longitude: 0 });

            const result = await getEventById({
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(result.gameDeleted).toBe(false);
            expect(result.game.$id).toBe("game1");
            expect(result.managerIds).toContain("user1");
            expect(result.scorekeeperIds).toContain("user1");
            expect(result.deferredData).toBeDefined();
            expect(result.deferredData.players).toBeInstanceOf(Promise);
            expect(result.deferredData.park).toBeInstanceOf(Promise);
            expect(result.deferredData.logs).toBeInstanceOf(Promise);
            expect(result.deferredData.achievements).toBeInstanceOf(Promise);
        });

        it("gracefully falls back when double-stringified playerChart fails JSON parsing", async () => {
            const mockGameBadChart = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: "Not even JSON at all",
                seasons: "season1",
            };
            const mockSeason = { $id: "season1", teams: ["team1"] };

            const mockListMemberships = jest.fn().mockResolvedValue({
                memberships: [{ userId: "user1", roles: ["owner"] }],
            });
            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: mockListMemberships,
                    getPrefs: jest.fn().mockResolvedValue({}),
                },
            });

            // Mock loadGameBase
            readDocument.mockResolvedValueOnce(mockGameBadChart);
            readDocument.mockResolvedValueOnce(mockSeason);
            listDocuments.mockResolvedValue({
                rows: [{ $id: "team1", name: "Team 1" }],
            });
            readDocument.mockResolvedValue({ latitude: 0, longitude: 0 });

            const result = await getEventById({
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(result.gameDeleted).toBe(false);
            // It should fall back to null if parse fails
            expect(result.game.playerChart).toBeNull();
        });

        it("enriches playerChart with jersey numbers from team preferences", async () => {
            const mockChart = [
                {
                    $id: "p1",
                    substitutions: [{ playerId: "p2", inning: 3 }],
                },
            ];
            const mockGameWithChart = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(JSON.stringify(mockChart)),
                seasons: "season1",
            };
            const mockSeason = { $id: "season1", teams: ["team1"] };

            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: jest.fn().mockResolvedValue({
                        memberships: [{ userId: "user1", roles: ["owner"] }],
                    }),
                    getPrefs: jest.fn().mockResolvedValue({
                        jerseyNumbers: { p1: "10", p2: "22" },
                    }),
                },
            });

            readDocument.mockResolvedValueOnce(mockGameWithChart);
            readDocument.mockResolvedValueOnce(mockSeason);
            listDocuments.mockResolvedValue({
                rows: [{ $id: "team1", name: "Team 1" }],
            });

            const result = await getEventById({
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(result.game.playerChart[0].jerseyNumber).toBe("10");
            expect(
                result.game.playerChart[0].substitutions[0].jerseyNumber,
            ).toBe("22");
        });

        it("should correctly identify scorekeepers", async () => {
            const mockGame = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(JSON.stringify({ lineup: [] })),
                seasons: "season1",
            };
            const mockSeason = {
                $id: "season1",
                teams: ["team1"],
                parkId: "park1",
            };
            const mockTeams = [{ $id: "team1", name: "Team 1" }];

            // Mock Teams API for memberships
            const mockListMemberships = jest.fn().mockResolvedValue({
                memberships: [
                    { userId: "user1", roles: ["owner"] },
                    { userId: "user2", roles: ["manager"] },
                    { userId: "user3", roles: ["scorekeeper"] },
                    { userId: "user4", roles: ["player"] },
                ],
            });
            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: mockListMemberships,
                    getPrefs: jest.fn().mockResolvedValue({}),
                },
            });

            readDocument.mockResolvedValueOnce(mockGame);
            readDocument.mockResolvedValueOnce(mockSeason);
            listDocuments.mockResolvedValue({ rows: mockTeams });
            readDocument.mockResolvedValue({ latitude: 0, longitude: 0 });

            const result = await getEventById({
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(result.managerIds).toContain("user1");
            expect(result.managerIds).toContain("user2");
            expect(result.managerIds).not.toContain("user3");
            expect(result.managerIds).not.toContain("user4");

            expect(result.scorekeeperIds).toContain("user1");
            expect(result.scorekeeperIds).toContain("user2");
            expect(result.scorekeeperIds).toContain("user3");
            expect(result.scorekeeperIds).not.toContain("user4");

            const user1 = result.userIds.find((u) => u.userId === "user1");
            const user3 = result.userIds.find((u) => u.userId === "user3");
            const user4 = result.userIds.find((u) => u.userId === "user4");

            expect(user1.role).toBe("manager");
            expect(user3.role).toBe("scorekeeper");
            expect(user4.role).toBe("player");
        });
    });

    describe("getEventWithPlayerCharts", () => {
        it("should return game data with resolved players", async () => {
            const mockGame = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(JSON.stringify({ lineup: [] })),
                seasons: "season1",
            };
            const mockSeason = {
                $id: "season1",
                teams: ["team1"],
                parkId: "park1",
            };
            const mockUsers = [{ $id: "user1", name: "Player 1" }];
            const mockAttendance = [{ $id: "att1" }];
            const mockTeams = [{ $id: "team1", name: "Team 1" }];

            // Mock Teams API and Users API
            const mockListMemberships = jest.fn().mockResolvedValue({
                memberships: [{ userId: "user1", roles: ["player"] }],
            });
            const mockListUsers = jest.fn().mockResolvedValue({
                users: [
                    { $id: "user1", prefs: { avatarUrl: "http://avatar.url" } },
                ],
            });
            createAdminClient.mockReturnValue({
                teams: {
                    listMemberships: mockListMemberships,
                    getPrefs: jest.fn().mockResolvedValue({}),
                },
                users: { list: mockListUsers },
            });

            // Mock for loadGameBase
            readDocument.mockResolvedValueOnce(mockGame); // game
            readDocument.mockResolvedValueOnce(mockSeason); // season

            // Mock all listDocuments calls in order
            listDocuments
                .mockResolvedValueOnce({ rows: mockTeams }) // teams
                .mockResolvedValueOnce({ rows: mockUsers }) // users in resolvePlayers
                .mockResolvedValueOnce({ rows: mockAttendance }); // attendance

            const result = await getEventWithPlayerCharts({
                client: mockSessionClient,
                eventId: "game1",
            });

            expect(result.game).toBeDefined();
            expect(result.players).toHaveLength(1);
            // Verify enrichment worked: avatarUrl from prefs should be present
            expect(result.players[0].avatarUrl).toBe("http://avatar.url");
            expect(result.attendance).toHaveLength(1);
        });

        it("should extract and resolve extra players from the chart", async () => {
            const mockGame = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(
                    JSON.stringify([
                        {
                            $id: "guest-starter",
                            substitutions: [{ playerId: "guest-sub" }],
                        },
                    ]),
                ),
                seasons: "season1",
            };
            const mockSeason = { $id: "season1", teams: ["team1"] };

            // Mock loadGameBase
            readDocument.mockResolvedValueOnce(mockGame);
            readDocument.mockResolvedValueOnce(mockSeason);
            listDocuments.mockResolvedValueOnce({
                rows: [{ $id: "team1", name: "Team 1" }],
            });

            // Mock memberships
            createAdminClient.mockReturnValue({
                teams: {
                    getPrefs: jest.fn().mockResolvedValue({}),
                    listMemberships: jest
                        .fn()
                        .mockResolvedValue({ memberships: [] }),
                },
                users: {
                    list: jest.fn().mockResolvedValue({ users: [] }),
                },
            });

            // resolvePlayers will be called with guest-starter and guest-sub.
            // Mock listDocuments for resolvePlayers to return these users.
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "guest-starter", name: "Guest Starter" },
                    { $id: "guest-sub", name: "Guest Sub" },
                ],
            });

            // Mock getAttendance
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await getEventWithPlayerCharts({
                client: mockSessionClient,
                eventId: "game1",
            });

            expect(result.players).toHaveLength(2);
            expect(result.players.map((p) => p.$id)).toContain("guest-starter");
            expect(result.players.map((p) => p.$id)).toContain("guest-sub");
        });
    });
});
