// Mock getAppwriteTeam
jest.mock("@/utils/teams.js", () => ({
    getAppwriteTeam: jest.fn(),
}));

import { getAppwriteTeam } from "@/utils/teams.js";

import {
    subscribeToTeam,
    unsubscribeFromTeam,
    getTeamSubscriptionStatus,
    subscribeToAllTeams,
} from "../notifications";

// Mock the server utility
jest.mock("@/utils/appwrite/server.js", () => {
    return {
        createAdminClient: jest.fn(),
        createSessionClient: jest.fn(),
    };
});

import {
    createAdminClient,
    createSessionClient,
} from "@/utils/appwrite/server.js";

// Mock implementation
const mockCreateSubscriber = jest.fn();
const mockDeleteSubscriber = jest.fn();
const mockListSubscribers = jest.fn();
const mockCreateTopic = jest.fn();
const mockTeamsList = jest.fn();

createAdminClient.mockImplementation(() => ({
    messaging: {
        createSubscriber: mockCreateSubscriber,
        deleteSubscriber: mockDeleteSubscriber,
        listSubscribers: mockListSubscribers,
        createTopic: mockCreateTopic,
    },
}));

createSessionClient.mockImplementation(() => ({
    teams: {
        list: mockTeamsList,
    },
}));

// Mock ID
jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
    MessagingProviderType: {
        Push: "push",
    },
    Query: {
        limit: jest.fn((val) => `limit(${val})`),
        cursorAfter: jest.fn((val) => `cursorAfter(${val})`),
    },
}));

const originalEnv = process.env;

describe("notification subscription actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            APPWRITE_ENDPOINT: "https://test.com",
            APPWRITE_PROJECT_ID: "test-project",
            APPWRITE_API_KEY: "test-key",
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe("subscribeToTeam", () => {
        it("should subscribe a target to a team topic", async () => {
            mockCreateSubscriber.mockResolvedValue({});

            const result = await subscribeToTeam({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result.success).toBe(true);
            expect(mockCreateSubscriber).toHaveBeenCalledWith(
                "team_team-123",
                "unique-id",
                "target-456",
            );
        });

        it("should handle already subscribed error (409)", async () => {
            const error = new Error("Conflict");
            error.code = 409;
            mockCreateSubscriber.mockRejectedValue(error);

            const result = await subscribeToTeam({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result.success).toBe(true);
            expect(result.alreadySubscribed).toBe(true);
        });

        it("should create topic if not found (404) and retry", async () => {
            // First attempt fails with 404
            const error404 = new Error("Not Found");
            error404.code = 404;

            mockCreateSubscriber
                .mockRejectedValueOnce(error404) // First call fails
                .mockResolvedValueOnce({}); // Second call succeeds

            mockCreateTopic.mockResolvedValue({});
            getAppwriteTeam.mockResolvedValue({ name: "My Team" });

            const result = await subscribeToTeam({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result.success).toBe(true);
            expect(result.createdTopic).toBe(true);
            expect(mockCreateTopic).toHaveBeenCalledWith(
                "team_team-123",
                "My Team",
            );
            // Should be called twice
            expect(mockCreateSubscriber).toHaveBeenCalledTimes(2);
        });

        it("should throw other errors", async () => {
            const error = new Error("Server Error");
            mockCreateSubscriber.mockRejectedValue(error);

            await expect(
                subscribeToTeam({
                    teamId: "team-123",
                    targetId: "target-456",
                }),
            ).rejects.toThrow("Server Error");
        });
    });

    describe("unsubscribeFromTeam", () => {
        it("should unsubscribe a target from a team topic", async () => {
            // Mock list response to find the subscriber
            mockListSubscribers.mockResolvedValue({
                subscribers: [
                    { $id: "sub-1", targetId: "target-789" },
                    { $id: "sub-2", targetId: "target-456" }, // Match
                ],
            });

            mockDeleteSubscriber.mockResolvedValue({});

            const result = await unsubscribeFromTeam({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result.success).toBe(true);
            expect(mockListSubscribers).toHaveBeenCalledWith(
                "team_team-123",
                expect.any(Array),
            );
            expect(mockDeleteSubscriber).toHaveBeenCalledWith(
                "team_team-123",
                "sub-2",
            );
        });

        it("should strictly match targetId", async () => {
            // Mock list response to find the subscriber
            mockListSubscribers.mockResolvedValue({
                subscribers: [{ $id: "sub-1", targetId: "target-789" }],
            });

            const result = await unsubscribeFromTeam({
                teamId: "team-123",
                targetId: "target-456",
            });

            // Should not call delete if not found
            expect(mockDeleteSubscriber).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });

    describe("getTeamSubscriptionStatus", () => {
        it("should return true if target is in subscribers list", async () => {
            mockListSubscribers.mockResolvedValue({
                subscribers: [{ $id: "sub-1", targetId: "target-456" }],
            });

            const result = await getTeamSubscriptionStatus({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result).toBe(true);
        });

        it("should return false if target is not in subscribers list", async () => {
            mockListSubscribers.mockResolvedValue({
                subscribers: [],
            });

            const result = await getTeamSubscriptionStatus({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result).toBe(false);
        });

        it("should return false if topic does not exist (404)", async () => {
            const error = new Error("Not Found");
            error.code = 404;
            mockListSubscribers.mockRejectedValue(error);

            const result = await getTeamSubscriptionStatus({
                teamId: "team-123",
                targetId: "target-456",
            });

            expect(result).toBe(false);
        });
    });

    describe("subscribeToAllTeams", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should subscribe to all user teams", async () => {
            const teams = [{ $id: "team-1" }, { $id: "team-2" }];
            mockTeamsList.mockResolvedValueOnce({
                teams,
                total: 2,
            });
            mockCreateSubscriber.mockResolvedValue({});

            const result = await subscribeToAllTeams({
                request: {},
                targetId: "target-123",
            });

            expect(result.success).toBe(true);
            expect(result.subscribedCount).toBe(2);
            expect(mockCreateSubscriber).toHaveBeenCalledTimes(2);
            expect(mockCreateSubscriber).toHaveBeenCalledWith(
                "team_team-1",
                "unique-id",
                "target-123",
            );
            expect(mockCreateSubscriber).toHaveBeenCalledWith(
                "team_team-2",
                "unique-id",
                "target-123",
            );
        });

        it("should handle pagination when subscribing to all teams", async () => {
            // First page (100 teams)
            const page1Teams = Array.from({ length: 100 }, (_, i) => ({
                $id: `team-${i}`,
            }));
            // Second page (1 team)
            const page2Teams = [{ $id: "team-100" }];

            mockTeamsList
                .mockResolvedValueOnce({
                    teams: page1Teams,
                    total: 101,
                })
                .mockResolvedValueOnce({
                    teams: page2Teams,
                    total: 101,
                });

            mockCreateSubscriber.mockResolvedValue({});

            const result = await subscribeToAllTeams({
                request: {},
                targetId: "target-123",
            });

            expect(result.success).toBe(true);
            expect(result.subscribedCount).toBe(101);
            expect(mockTeamsList).toHaveBeenCalledTimes(2);
            expect(mockCreateSubscriber).toHaveBeenCalledTimes(101);
        });

        it("should report partial failures but continue subscribing", async () => {
            const teams = [{ $id: "team-1" }, { $id: "team-2" }];
            mockTeamsList.mockResolvedValueOnce({
                teams,
                total: 2,
            });

            mockCreateSubscriber
                .mockResolvedValueOnce({}) // Success for first
                .mockRejectedValueOnce(new Error("Failed")); // Fail for second

            const result = await subscribeToAllTeams({
                request: {},
                targetId: "target-123",
            });

            expect(result.success).toBe(true);
            expect(result.subscribedCount).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].teamId).toBe("team-2");
        });

        it("should return error if request fails", async () => {
            mockTeamsList.mockRejectedValue(new Error("Network error"));

            const result = await subscribeToAllTeams({
                request: {},
                targetId: "target-123",
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Network error");
        });
    });
});
