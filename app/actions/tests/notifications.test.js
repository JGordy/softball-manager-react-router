import { NOTIFICATION_TYPES } from "@/utils/notifications";

import {
    sendPushNotification,
    sendTeamNotification,
    sendGameReminder,
    sendLineupFinalizedNotification,
    sendAttendanceRequest,
    sendGameFinalNotification,
} from "../notifications";

// Use the __mocks__/node-appwrite.js mock for generic Appwrite SDK classes
jest.mock("node-appwrite");

// Optionally override specifics for this test suite
import { ID, Messaging } from "node-appwrite";
ID.unique.mockImplementation(() => "unique-id-123");
Messaging.mockImplementation(() => ({
    createPush: jest.fn().mockResolvedValue({
        $id: "message-id-123",
    }),
}));

// Mock the server utility
jest.mock("@/utils/appwrite/server.js", () => {
    const { Messaging } = require("node-appwrite");
    return {
        createAdminClient: jest.fn(() => ({
            messaging: new Messaging(),
        })),
    };
});

// Store original env
const originalEnv = process.env;

describe("notifications actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            APPWRITE_ENDPOINT: "https://appwrite.example.com/v1",
            APPWRITE_PROJECT_ID: "test-project",
            APPWRITE_API_KEY: "test-api-key",
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe("sendPushNotification", () => {
        it("should throw error if no userIds provided", async () => {
            await expect(
                sendPushNotification({
                    userIds: [],
                    title: "Test",
                    body: "Test body",
                }),
            ).rejects.toThrow("At least one user ID is required");
        });

        it("should throw error if userIds is not an array", async () => {
            await expect(
                sendPushNotification({
                    userIds: null,
                    title: "Test",
                    body: "Test body",
                }),
            ).rejects.toThrow("At least one user ID is required");
        });

        it("should throw error if userId is invalid", async () => {
            await expect(
                sendPushNotification({
                    userIds: [123], // not a string
                    title: "Test",
                    body: "Test body",
                }),
            ).rejects.toThrow("Valid user ID is required");
        });

        it("should throw error if title is missing", async () => {
            await expect(
                sendPushNotification({
                    userIds: ["user-1"],
                    title: "",
                    body: "Test body",
                }),
            ).rejects.toThrow("Notification title is required");
        });

        it("should throw error if body is missing", async () => {
            await expect(
                sendPushNotification({
                    userIds: ["user-1"],
                    title: "Test",
                    body: "",
                }),
            ).rejects.toThrow("Notification body is required");
        });

        it("should successfully send notification to users", async () => {
            const result = await sendPushNotification({
                userIds: ["user-1", "user-2"],
                title: "Test Title",
                body: "Test body message",
                type: NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT,
                url: "/test",
            });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe("message-id-123");
            expect(result.recipientCount).toBe(2);
        });

        it("should use default type if not provided", async () => {
            const result = await sendPushNotification({
                userIds: ["user-1"],
                title: "Test",
                body: "Body",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("sendTeamNotification", () => {
        it("should throw error if teamId is missing", async () => {
            await expect(
                sendTeamNotification({
                    teamId: "",
                    title: "Test",
                    body: "Test body",
                }),
            ).rejects.toThrow("Team ID is required");
        });

        it("should successfully send notification to team topic", async () => {
            const result = await sendTeamNotification({
                teamId: "team-123",
                title: "Team Announcement",
                body: "Hello team!",
            });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe("message-id-123");
            expect(result.topic).toBe("team_team-123");
        });

        it("should use default URL based on teamId if not provided", async () => {
            const result = await sendTeamNotification({
                teamId: "team-123",
                title: "Team Announcement",
                body: "Hello team!",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("sendGameReminder", () => {
        it("should throw error if gameId is missing", async () => {
            await expect(
                sendGameReminder({
                    gameId: "",
                    teamId: "team-123",
                    userIds: ["user-1"],
                    gameName: "Game vs Opponent",
                    gameTime: "7:00 PM",
                    location: "Field 1",
                }),
            ).rejects.toThrow("Game ID is required");
        });

        it("should send game reminder with correct format", async () => {
            const result = await sendGameReminder({
                gameId: "game-123",
                teamId: "team-123",
                userIds: ["user-1", "user-2"],
                gameName: "Game vs Opponent",
                gameTime: "7:00 PM",
                location: "Field 1",
            });

            expect(result.success).toBe(true);
            expect(result.recipientCount).toBe(2);
        });

        it("should handle missing location gracefully", async () => {
            const result = await sendGameReminder({
                gameId: "game-123",
                teamId: "team-123",
                userIds: ["user-1"],
                gameName: "Game vs Opponent",
                gameTime: "7:00 PM",
                location: "",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("sendLineupFinalizedNotification", () => {
        it("should throw error if gameId is missing", async () => {
            await expect(
                sendLineupFinalizedNotification({
                    gameId: "",
                    teamId: "team-123",
                    userIds: ["user-1"],
                    gameName: "Game vs Opponent",
                }),
            ).rejects.toThrow("Game ID is required");
        });

        it("should send lineup finalized notification", async () => {
            const result = await sendLineupFinalizedNotification({
                gameId: "game-123",
                teamId: "team-123",
                userIds: ["user-1", "user-2", "user-3"],
                gameName: "Game vs Opponent",
            });

            expect(result.success).toBe(true);
            expect(result.recipientCount).toBe(3);
        });
    });

    describe("sendAttendanceRequest", () => {
        it("should throw error if gameId is missing", async () => {
            await expect(
                sendAttendanceRequest({
                    gameId: "",
                    teamId: "team-123",
                    userIds: ["user-1"],
                    gameName: "Game vs Opponent",
                    gameDate: "Dec 15, 2025",
                }),
            ).rejects.toThrow("Game ID is required");
        });

        it("should send attendance request notification", async () => {
            const result = await sendAttendanceRequest({
                gameId: "game-123",
                teamId: "team-123",
                userIds: ["user-1"],
                gameName: "Game vs Opponent",
                gameDate: "Dec 15, 2025",
            });

            expect(result.success).toBe(true);
            expect(result.recipientCount).toBe(1);
        });
    });

    describe("sendGameFinalNotification", () => {
        it("should throw error if gameId is missing", async () => {
            await expect(
                sendGameFinalNotification({
                    gameId: "",
                    teamId: "team-123",
                    userIds: ["user-1"],
                    gameName: "Game vs Opponent",
                    score: "10-2",
                }),
            ).rejects.toThrow("Game ID is required");
        });

        it("should send game final notification with correct format", async () => {
            const result = await sendGameFinalNotification({
                gameId: "game-123",
                teamId: "team-123",
                userIds: ["user-1"],
                gameName: "Game vs Opponent",
                score: "10-2",
            });

            expect(result.success).toBe(true);
        });
    });
});
