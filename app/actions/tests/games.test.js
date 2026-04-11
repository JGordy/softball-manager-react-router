import {
    createSingleGame,
    createGames,
    updateGame,
    deleteGame,
    deleteGames,
} from "../games";
import {
    createDocument,
    updateDocument,
    deleteDocument,
} from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";
import { getNotifiableTeamMembers, getTeamMembers } from "@/utils/teams";
import { createAdminClient } from "@/utils/appwrite/server";

import {
    sendGameFinalNotification,
    sendAwardVoteNotification,
} from "../notifications";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/actions/parks", () => ({
    findOrCreatePark: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("@/utils/dateTime", () => ({
    combineDateTime: jest.fn((date, time) => `${date}T${time}`),
}));

jest.mock("../notifications", () => ({
    sendGameFinalNotification: jest.fn().mockResolvedValue({ success: true }),
    sendAwardVoteNotification: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/utils/teams", () => ({
    getNotifiableTeamMembers: jest.fn(),
    getTeamMembers: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

jest.mock("../attendance", () => ({
    updatePlayerAttendance: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("react-router", () => ({
    redirect: jest.fn((path) => ({ redirect: path })),
}));

describe("Games Actions", () => {
    const mockSessionClient = { tablesDB: { id: "mock-session-db" } };
    const mockAdminClient = {
        users: { getPrefs: jest.fn() },
        functions: { createExecution: jest.fn().mockResolvedValue({}) },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        hasBadWords.mockResolvedValue(false);

        const mockUsers = {
            getPrefs: jest.fn().mockResolvedValue({}),
        };
        mockAdminClient.users.getPrefs = mockUsers.getPrefs;
        createAdminClient.mockReturnValue(mockAdminClient);
        const { createSessionClient } = require("@/utils/appwrite/server");
        createSessionClient.mockResolvedValue(mockSessionClient);
        getTeamMembers.mockResolvedValue({ memberships: [] });
        getNotifiableTeamMembers.mockResolvedValue(["user1"]);
        process.env.APPWRITE_GAME_AWARD_TALLY_FUNCTION_ID = "tally-function-id";
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("createSingleGame", () => {
        it("should create a game successfully", async () => {
            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                isHomeGame: "true",
                opponent: "Team A",
                seasonId: "season1",
                teamId: "team1",
                timeZone: "America/New_York",
            };

            createDocument.mockResolvedValue({ $id: "game1" });

            const result = await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "games",
                "unique-id",
                {
                    isHomeGame: true,
                    gameDate: "2024-01-01T10:00",
                    opponent: "Team A",
                    location: null,
                    parkId: null,
                    teamId: "team1",
                    eventType: "game",
                    seasons: "season1",
                    seasonId: "season1",
                    timeZone: "America/New_York",
                },
                expect.arrayContaining([
                    'update("team:team1/scorekeeper")',
                    'delete("team:team1/manager")',
                ]),
                mockSessionClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should create a practice event successfully", async () => {
            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                isHomeGame: "false",
                opponent: "Practice Session",
                teamId: "team1",
                eventType: "practice",
            };

            createDocument.mockResolvedValue({ $id: "practice1" });

            const result = await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "games",
                "unique-id",
                expect.objectContaining({
                    opponent: "Practice Session",
                    eventType: "practice",
                }),
                expect.any(Array),
                mockSessionClient,
            );
            expect(result.success).toBe(true);
        });

        it("should clear parkId and location when matching season location", async () => {
            const { readDocument } = require("@/utils/databases");
            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                location: "Season Park",
                seasonId: "season1",
                teamId: "team1",
            };

            readDocument.mockResolvedValue({
                $id: "season1",
                location: "Season Park",
            });
            createDocument.mockResolvedValue({ $id: "game1" });

            await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "games",
                "unique-id",
                expect.objectContaining({
                    location: null,
                    parkId: null,
                }),
                expect.any(Array),
                mockSessionClient,
            );
        });

        it("should normalize empty string location to null", async () => {
            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                location: "",
                teamId: "team1",
            };

            createDocument.mockResolvedValue({ $id: "game1" });

            await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "games",
                "unique-id",
                expect.objectContaining({
                    location: null,
                }),
                expect.any(Array),
                mockSessionClient,
            );
        });

        it("should set correct permissions including manager", async () => {
            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                opponent: "Team A",
                teamId: "team1",
            };

            createDocument.mockResolvedValue({ $id: "game1" });

            await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "games",
                "unique-id",
                expect.any(Object),
                expect.arrayContaining([
                    'update("team:team1/scorekeeper")',
                    'delete("team:team1/manager")',
                ]),
                mockSessionClient,
            );

            // Double check that delete(manager) IS present
            const permissionsCall = createDocument.mock.calls[0][3];
            expect(permissionsCall).toContain('delete("team:team1/manager")');
        });

        it("should reject games with bad words in opponent name", async () => {
            hasBadWords.mockResolvedValue(true);

            const mockValues = {
                opponent: "BadWord Team",
                gameDate: "2024-01-01",
                gameTime: "10:00",
                teamId: "team1",
            };

            const result = await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(createDocument).not.toHaveBeenCalled();
        });

        it("should initialize attendance based on user defaults", async () => {
            const { getTeamMembers } = require("@/utils/teams");
            const { createAdminClient } = require("@/utils/appwrite/server");
            const { updatePlayerAttendance } = require("../attendance");

            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                opponent: "Team A",
                teamId: "team1",
            };

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId: "user-accepted" },
                    { userId: "user-declined" },
                    { userId: "user-string-accepted" },
                ],
            });

            const getPrefs = jest
                .fn()
                .mockResolvedValueOnce({
                    defaultAvailability: { team1: "accepted" },
                })
                .mockResolvedValueOnce({
                    defaultAvailability: { team1: "declined" },
                })
                .mockResolvedValueOnce({
                    defaultAvailability: JSON.stringify({ team1: "accepted" }),
                });

            createAdminClient.mockReturnValue({ users: { getPrefs } });
            createDocument.mockResolvedValue({ $id: "game1" });

            await createSingleGame({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(updatePlayerAttendance).toHaveBeenCalledTimes(2);
            expect(updatePlayerAttendance).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({
                        playerId: "user-accepted",
                        status: "accepted",
                    }),
                    eventId: "game1",
                }),
            );
            expect(updatePlayerAttendance).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({
                        playerId: "user-string-accepted",
                        status: "accepted",
                    }),
                    eventId: "game1",
                }),
            );
        });
    });

    describe("createGames", () => {
        it("should create multiple games", async () => {
            const mockValues = {
                games: JSON.stringify([
                    {
                        opponent: "Team A",
                        gameDate: "2024-01-01",
                        teamId: "team1",
                        seasonId: "season1",
                    },
                    {
                        opponent: "Team B",
                        gameDate: "2024-01-02",
                        teamId: "team1",
                        seasonId: "season1",
                    },
                ]),
                timeZone: "America/New_York",
            };

            createDocument.mockResolvedValue({ $id: "game1" });

            const result = await createGames({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(createDocument).toHaveBeenCalledTimes(2);
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.response.games).toHaveLength(2);
        });

        it("should initialize attendance for all created games", async () => {
            const { getTeamMembers } = require("@/utils/teams");
            const { createAdminClient } = require("@/utils/appwrite/server");
            const { updatePlayerAttendance } = require("../attendance");

            const mockValues = {
                games: JSON.stringify([
                    { opponent: "Team A", teamId: "team1" },
                ]),
                timeZone: "America/New_York",
            };

            getTeamMembers.mockResolvedValue({
                memberships: [{ userId: "user1" }],
            });

            createAdminClient.mockReturnValue({
                users: {
                    getPrefs: jest.fn().mockResolvedValue({
                        defaultAvailability: { team1: "accepted" },
                    }),
                },
            });

            createDocument.mockResolvedValue({ $id: "game1" });

            await createGames({
                values: mockValues,
                client: mockSessionClient,
            });

            expect(updatePlayerAttendance).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({
                        playerId: "user1",
                        status: "accepted",
                    }),
                    eventId: "game1",
                }),
            );
        });
    });

    describe("updateGame", () => {
        it("should update game successfully", async () => {
            const mockValues = {
                opponent: "Updated Team",
                score: "10",
                opponentScore: "5",
            };

            updateDocument.mockResolvedValue({ $id: "game1", teamId: "team1" });

            const result = await updateGame({
                values: mockValues,
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "games",
                "game1",
                {
                    opponent: "Updated Team",
                    score: "10",
                    opponentScore: "5",
                    result: "won",
                },
                mockSessionClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
            expect(result.event).toEqual({
                name: "game-scored",
                data: { eventId: "game1", teamId: "team1" },
            });
        });

        it("should not emit event when updates are not score related", async () => {
            const mockValues = {
                opponent: "New Name",
            };

            updateDocument.mockResolvedValue({ $id: "game1", teamId: "team1" });

            const result = await updateGame({
                values: mockValues,
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(result.event).toBeUndefined();
        });

        it("should clear parkId for manual location edits", async () => {
            const mockValues = {
                location: "Manually Typed Park",
            };

            updateDocument.mockResolvedValue({ $id: "game1" });

            await updateGame({
                values: mockValues,
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "games",
                "game1",
                expect.objectContaining({
                    location: "Manually Typed Park",
                    parkId: null,
                }),
                mockSessionClient,
            );
        });

        it("should clear location when matching season location in update", async () => {
            const { readDocument } = require("@/utils/databases");
            const mockValues = {
                location: "Season Park",
                seasonId: "season1",
            };

            readDocument.mockResolvedValue({
                $id: "season1",
                location: "Season Park",
            });
            updateDocument.mockResolvedValue({ $id: "game1" });

            await updateGame({
                values: mockValues,
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "games",
                "game1",
                expect.objectContaining({
                    location: null,
                    parkId: null,
                }),
                mockSessionClient,
            );
        });

        it("should compute result correctly", async () => {
            updateDocument.mockResolvedValue({ $id: "game1" });

            // Test win
            let result = await updateGame({
                values: { score: "10", opponentScore: "5" },
                eventId: "game1",
                client: mockSessionClient,
            });
            expect(result.response.gameDetails).toBeDefined();

            // Test loss
            result = await updateGame({
                values: { score: "5", opponentScore: "10" },
                eventId: "game1",
                client: mockSessionClient,
            });
            expect(result.response.gameDetails).toBeDefined();

            // Test tie
            result = await updateGame({
                values: { score: "5", opponentScore: "5" },
                eventId: "game1",
                client: mockSessionClient,
            });
            expect(result.response.gameDetails).toBeDefined();
        });

        it("should reject updates with bad words", async () => {
            hasBadWords.mockResolvedValue(true);

            const result = await updateGame({
                values: { opponent: "BadWord Team" },
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });

        it("should send notification when game is final", async () => {
            jest.useFakeTimers();
            const mockGame = {
                $id: "game1",
                teamId: "team1",
                opponent: "Tigers",
                score: "12",
                opponentScore: "4",
                result: "won",
                gameFinal: true,
            };
            updateDocument.mockResolvedValue(mockGame);

            await updateGame({
                values: { gameFinal: "true" },
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(sendGameFinalNotification).toHaveBeenCalledWith({
                gameId: "game1",
                teamId: "team1",
                userIds: ["user1"],
                opponent: "Tigers",
                score: "won 12 - 4",
            });

            expect(
                mockAdminClient.functions.createExecution,
            ).toHaveBeenCalledWith(
                process.env.APPWRITE_GAME_AWARD_TALLY_FUNCTION_ID,
                JSON.stringify({
                    action: "evaluate_achievements",
                    gameId: "game1",
                }),
                true,
            );

            // Fast-forward 5.5 seconds
            jest.advanceTimersByTime(5500);

            expect(sendAwardVoteNotification).toHaveBeenCalledWith({
                gameId: "game1",
                teamId: "team1",
                userIds: ["user1"],
                opponent: "Tigers",
            });
            jest.useRealTimers();
        });

        it("should send notification when scores are provided", async () => {
            jest.useFakeTimers();
            const mockGame = {
                $id: "game1",
                teamId: "team1",
                opponent: "Tigers",
                score: "12",
                opponentScore: "4",
            };
            updateDocument.mockResolvedValue(mockGame);

            await updateGame({
                values: { score: "12", opponentScore: "4" },
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(sendGameFinalNotification).toHaveBeenCalled();
            jest.advanceTimersByTime(5500);
            expect(sendAwardVoteNotification).toHaveBeenCalled();
            jest.useRealTimers();
        });
    });

    describe("deleteGame", () => {
        it("should delete game with session client", async () => {
            const mockTablesDB = { deleteRow: jest.fn().mockResolvedValue({}) };

            const server = require("@/utils/appwrite/server");
            server.createSessionClient.mockResolvedValue({
                tablesDB: mockTablesDB,
            });

            const result = await deleteGame({
                values: {},
                eventId: "game1",
                client: mockSessionClient,
            });

            expect(deleteDocument).toHaveBeenCalledWith(
                "games",
                "game1",
                mockSessionClient,
            );
            expect(result.deleted).toBe(true);
        });
    });

    describe("deleteGames", () => {
        it("returns error for invalid gameIds", async () => {
            const result = await deleteGames({ values: { gameIds: "[]" } });
            expect(result.success).toBe(false);
            expect(result.status).toBe(400);

            const result2 = await deleteGames({
                values: { gameIds: "invalid" },
            });
            expect(result2.success).toBe(false);
        });

        it("deletes multiple games successfully", async () => {
            const mockTablesDB = { deleteRow: jest.fn().mockResolvedValue({}) };
            deleteDocument.mockResolvedValue({});

            const server = require("@/utils/appwrite/server");
            server.createSessionClient.mockResolvedValue({
                tablesDB: mockTablesDB,
            });

            const result = await deleteGames({
                values: { gameIds: '["game1", "game2"]' },
                client: mockSessionClient,
            });

            expect(result.success).toBe(true);
            expect(result.deleted).toBe(true);
            expect(result.status).toBe(200);
            expect(deleteDocument).toHaveBeenCalledTimes(2);
        });

        it("handles partial failures correctly", async () => {
            const mockTablesDB = { deleteRow: jest.fn() };

            deleteDocument.mockImplementation((collection, id) => {
                if (id === "game2") {
                    return Promise.reject(new Error("Failed to delete game2"));
                }
                return Promise.resolve({});
            });

            const server = require("@/utils/appwrite/server");
            server.createSessionClient.mockResolvedValue({
                tablesDB: mockTablesDB,
            });

            const result = await deleteGames({
                values: { gameIds: '["game1", "game2", "game3"]' },
                client: mockSessionClient,
            });

            expect(result.success).toBe(true); // partially successful
            expect(result.status).toBe(207); // Partial status
            expect(result.message).toMatch(/2 games deleted, 1 failed/);
            expect(result.deleted).toBe(true);
        });
    });
});
