import { listDocuments, readDocument } from "@/utils/databases";

import { getEventById, getEventWithPlayerCharts } from "../games";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
}));

import { createAdminClient } from "@/utils/appwrite/server";

// Mock global fetch for weather API
global.fetch = jest.fn();

describe("Games Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});

        // Default mock for fetch to prevent errors
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("getEventById", () => {
        it("should return gameDeleted: true if game is not found", async () => {
            readDocument.mockRejectedValue({ code: 404 });

            const result = await getEventById({ eventId: "missing" });

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
                teams: { listMemberships: mockListMemberships },
            });

            // Mock for loadGameBase
            readDocument.mockResolvedValueOnce(mockGame); // game
            readDocument.mockResolvedValueOnce(mockSeason); // season

            // Mock for teams query and deferred data queries (users, attendance, awards, votes)
            listDocuments.mockResolvedValue({ rows: mockTeams });

            // Mock for getWeatherData
            readDocument.mockResolvedValue({ latitude: 0, longitude: 0 });

            const result = await getEventById({ eventId: "game1" });

            expect(result.gameDeleted).toBe(false);
            expect(result.game.$id).toBe("game1");
            expect(result.managerIds).toContain("user1");
            expect(result.scorekeeperIds).toContain("user1");
            expect(result.deferredData).toBeDefined();
            expect(result.deferredData.players).toBeInstanceOf(Promise);
            expect(result.deferredData.park).toBeInstanceOf(Promise);
            expect(result.deferredData.logs).toBeInstanceOf(Promise);
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
                teams: { listMemberships: mockListMemberships },
            });

            readDocument.mockResolvedValueOnce(mockGame);
            readDocument.mockResolvedValueOnce(mockSeason);
            listDocuments.mockResolvedValue({ rows: mockTeams });
            readDocument.mockResolvedValue({ latitude: 0, longitude: 0 });

            const result = await getEventById({ eventId: "game1" });

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

            // Mock Teams API for memberships
            const mockListMemberships = jest.fn().mockResolvedValue({
                memberships: [{ userId: "user1", roles: ["player"] }],
            });
            createAdminClient.mockReturnValue({
                teams: { listMemberships: mockListMemberships },
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
                request: {},
                eventId: "game1",
            });

            expect(result.game).toBeDefined();
            expect(result.players).toHaveLength(1);
            expect(result.players[0].name).toBe("Player 1");
            expect(result.attendance).toHaveLength(1);
        });
    });
});
