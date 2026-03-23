import {
    invitePlayerByEmail,
    invitePlayers,
    invitePlayersServer,
    acceptTeamInvitation,
    setPasswordForInvitedUser,
} from "../invitations";

// Mock fetch globally
global.fetch = jest.fn();

// Mock cookie module
jest.mock("cookie", () => ({
    serialize: jest.fn((name, value, options) => `${name}=${value}; HttpOnly`),
}));

// Note: This test needs custom Users class mock, so can't use __mocks__/node-appwrite.js
const mockUpdatePassword = jest.fn().mockResolvedValue({});
const mockCreateSession = jest.fn().mockResolvedValue({
    secret: "test-session-secret",
});
jest.mock("node-appwrite", () => ({
    Query: { equal: jest.fn((k, v) => ({ key: k, value: v })) },
    Permission: {
        read: jest.fn(),
        write: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    Role: {
        any: jest.fn(),
        user: jest.fn((id) => `user:${id}`),
        team: jest.fn(),
    },
    Users: jest.fn().mockImplementation(() => ({
        updatePassword: mockUpdatePassword,
        createSession: mockCreateSession,
    })),
}));

// Mock appwrite client SDK
jest.mock("appwrite", () => ({
    Client: jest.fn().mockImplementation(() => ({
        setEndpoint: jest.fn().mockReturnThis(),
        setProject: jest.fn().mockReturnThis(),
    })),
    Teams: jest.fn().mockImplementation(() => ({
        updateMembershipStatus: jest.fn(),
    })),
}));

// Mock server utilities
const mockCreateSessionClient = jest.fn();
const mockCreateAdminClient = jest.fn();
const mockParseSessionCookie = jest.fn();

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: (...args) => mockCreateSessionClient(...args),
    createAdminClient: (...args) => mockCreateAdminClient(...args),
    parseSessionCookie: (...args) => mockParseSessionCookie(...args),
}));

// Mock databases
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn().mockResolvedValue({}),
    readDocument: jest.fn().mockRejectedValue(new Error("Not found")),
}));

describe("Invitations Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // jest.spyOn(console, "error").mockImplementation(() => {});

        // Set up environment variables
        process.env.VITE_APPWRITE_HOST_URL = "https://test.appwrite.io/v1";
        process.env.VITE_APPWRITE_PROJECT_ID = "test-project";
    });

    afterEach(() => {
        if (console.error.mockRestore) console.error.mockRestore();
    });

    describe("invitePlayerByEmail", () => {
        let mockTeamsClient;

        beforeEach(() => {
            mockTeamsClient = {
                createMembership: jest.fn(),
            };
        });

        it("should send invitation successfully", async () => {
            mockTeamsClient.createMembership.mockResolvedValue({
                $id: "membership-123",
                userId: "user-456",
            });

            const result = await invitePlayerByEmail({
                email: "player@example.com",
                teamId: "team-123",
                name: "John Doe",
                url: "http://localhost/accept",
                client: { teams: mockTeamsClient },
            });

            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.message).toContain(
                "Invitation sent to player@example.com",
            );
        });

        it("should handle API errors", async () => {
            mockTeamsClient.createMembership.mockRejectedValue({
                message: "User already invited",
            });
            const result = await invitePlayerByEmail({
                email: "player@example.com",
                teamId: "team-123",
                name: "John Doe",
                url: "http://localhost/accept",
                client: { teams: mockTeamsClient },
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("User already invited");
        });

        it("should send correct payload to Appwrite API", async () => {
            mockTeamsClient.createMembership.mockResolvedValue({
                $id: "membership-123",
                userId: "user-456",
            });

            await invitePlayerByEmail({
                email: "player@example.com",
                teamId: "team-123",
                name: "John Doe",
                url: "http://localhost/accept",
                client: { teams: mockTeamsClient },
            });

            expect(mockTeamsClient.createMembership).toHaveBeenCalledWith(
                "team-123",
                ["player"],
                "player@example.com",
                undefined,
                undefined,
                "http://localhost/accept",
                "John Doe",
            );
        });
    });

    describe("invitePlayers", () => {
        const teamId = "team-123";
        const url = "http://localhost/accept";
        const players = [
            { email: "p1@example.com", name: "P1" },
            { email: "p2@example.com", name: "P2" },
        ];
        let mockTeamsClient;

        beforeEach(() => {
            mockTeamsClient = {
                createMembership: jest.fn(),
            };
        });

        it("should invite all players successfully", async () => {
            mockTeamsClient.createMembership.mockResolvedValue({
                $id: "membership-123",
                userId: "user-456",
            });

            const result = await invitePlayers({
                players,
                teamId,
                url,
                client: { teams: mockTeamsClient },
            });

            expect(result.success).toBe(true);
            expect(result.message).toContain("Successfully invited 2 players");
            expect(result.warning).toBeUndefined();
        });

        it("should handle mixed success (partial failure)", async () => {
            mockTeamsClient.createMembership
                .mockResolvedValueOnce({ $id: "m1", userId: "u1" })
                .mockRejectedValueOnce({ message: "Already invited" });

            const result = await invitePlayers({
                players,
                teamId,
                url,
                client: { teams: mockTeamsClient },
            });

            expect(result.success).toBe(true);
            expect(result.warning).toBe(true);
            expect(result.message).toContain("Invited 1 player");
            expect(result.message).toContain("Failed to invite 1");
        });

        it("should return false if all invites fail", async () => {
            mockTeamsClient.createMembership.mockRejectedValue({
                message: "Simulated Error",
            });

            const result = await invitePlayers({
                players,
                teamId,
                url,
                client: { teams: mockTeamsClient },
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to send any invitations");
            expect(result.errors).toHaveLength(2);
        });

        it("should handle empty player list gracefully", async () => {
            const result = await invitePlayers({
                players: [],
                teamId,
                url,
                client: { teams: mockTeamsClient },
            });

            expect(result.success).toBe(true);
            expect(result.message).toContain("Successfully invited 0 players");
        });
    });

    describe("acceptTeamInvitation", () => {
        it("should accept invitation successfully", async () => {
            const { Teams } = require("appwrite");
            const mockUpdateMembershipStatus = jest.fn().mockResolvedValue({
                userEmail: "player@example.com",
                userName: "John Doe",
            });
            Teams.mockImplementation(() => ({
                updateMembershipStatus: mockUpdateMembershipStatus,
            }));

            const result = await acceptTeamInvitation({
                teamId: "team-123",
                membershipId: "membership-456",
                userId: "user-789",
                secret: "secret-token",
            });

            expect(result.success).toBe(true);
            expect(result.inviteAccepted).toBe(true);
            expect(result.email).toBe("player@example.com");
            expect(result.name).toBe("John Doe");
        });

        it("should handle already confirmed membership", async () => {
            const { Teams } = require("appwrite");
            Teams.mockImplementation(() => ({
                updateMembershipStatus: jest
                    .fn()
                    .mockRejectedValue(
                        new Error("Membership is already confirmed"),
                    ),
            }));

            const result = await acceptTeamInvitation({
                teamId: "team-123",
                membershipId: "membership-456",
                userId: "user-789",
                secret: "secret-token",
            });

            expect(result.success).toBe(true);
            expect(result.inviteAccepted).toBe(true);
            expect(result.alreadyConfirmed).toBe(true);
        });

        it("should handle other errors", async () => {
            const { Teams } = require("appwrite");
            Teams.mockImplementation(() => ({
                updateMembershipStatus: jest
                    .fn()
                    .mockRejectedValue(new Error("Invalid secret")),
            }));

            const result = await acceptTeamInvitation({
                teamId: "team-123",
                membershipId: "membership-456",
                userId: "user-789",
                secret: "wrong-secret",
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid secret");
        });
    });

    describe("setPasswordForInvitedUser", () => {
        beforeEach(() => {
            // Reset mocks for each test
            mockUpdatePassword.mockResolvedValue({});
            mockCreateSession.mockResolvedValue({
                secret: "test-session-secret",
            });
            mockCreateAdminClient.mockReturnValue({
                account: {
                    client: {},
                },
                databases: {},
            });
        });

        it("should set password and return redirect response", async () => {
            const result = await setPasswordForInvitedUser({
                userId: "user-123",
                email: "player@example.com",
                password: "securepassword123",
            });

            // Response is a Web API, check its properties directly
            expect(result.status).toBe(302);
            expect(result.headers.get("Location")).toBe("/");
            expect(result.headers.get("Set-Cookie")).toContain(
                "appwrite-session",
            );
        });

        it("should reject password shorter than 8 characters", async () => {
            const result = await setPasswordForInvitedUser({
                userId: "user-123",
                email: "player@example.com",
                password: "short",
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe(
                "Password must be at least 8 characters long",
            );
        });

        it("should reject empty password", async () => {
            const result = await setPasswordForInvitedUser({
                userId: "user-123",
                email: "player@example.com",
                password: "",
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe(
                "Password must be at least 8 characters long",
            );
        });

        it("should handle errors during password update", async () => {
            mockUpdatePassword.mockRejectedValue(new Error("User not found"));

            const result = await setPasswordForInvitedUser({
                userId: "invalid-user",
                email: "player@example.com",
                password: "securepassword123",
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("User not found");
        });
    });

    describe("invitePlayersServer", () => {
        const teamId = "team-123";
        const url = "http://localhost/accept";
        const players = [{ email: "test@example.com", name: "Test User" }];
        const request = {
            headers: {
                get: jest.fn().mockReturnValue("appwrite-session=s1"),
            },
        };

        let mockSessionTeams, mockSessionAccount;
        let mockAdminTeams, mockAdminUsers;

        beforeEach(() => {
            // Setup Mocks by resetting the global mocks and providing new return values
            mockCreateSessionClient.mockReset();
            mockCreateAdminClient.mockReset();
            mockParseSessionCookie.mockReset();

            mockSessionTeams = {
                listMemberships: jest.fn().mockResolvedValue({
                    total: 1,
                    memberships: [{ roles: ["owner"] }],
                }),
                createMembership: jest.fn(),
            };
            mockSessionAccount = {
                get: jest.fn().mockResolvedValue({ $id: "user-123" }),
            };
            mockCreateSessionClient.mockResolvedValue({
                teams: mockSessionTeams,
                account: mockSessionAccount,
            });

            mockAdminUsers = {
                list: jest.fn(),
            };
            mockAdminTeams = {
                listMemberships: jest.fn(),
                createMembership: jest.fn(),
            };
            mockCreateAdminClient.mockReturnValue({
                users: mockAdminUsers,
                teams: mockAdminTeams,
            });

            mockParseSessionCookie.mockReturnValue("s1");
        });

        it("should fail if permission check returns no membership", async () => {
            mockSessionTeams.listMemberships.mockResolvedValue({
                total: 0,
                memberships: [],
            });

            const result = await invitePlayersServer({
                players,
                teamId,
                url,
                client: {
                    teams: mockSessionTeams,
                    account: mockSessionAccount,
                },
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("You do not have permission");
        });

        it("should fail if permission check returns non-owner role", async () => {
            mockSessionTeams.listMemberships.mockResolvedValue({
                total: 1,
                memberships: [{ roles: ["player"] }],
            });

            const result = await invitePlayersServer({
                players,
                teamId,
                url,
                client: {
                    teams: mockSessionTeams,
                    account: mockSessionAccount,
                },
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("You do not have permission");
        });

        it("should auto-add existing users via Admin Client", async () => {
            // User exists
            mockAdminUsers.list.mockResolvedValue({
                total: 1,
                users: [{ $id: "existing-u1", email: "test@example.com" }],
            });
            // User not in team yet
            mockAdminTeams.listMemberships.mockResolvedValue({
                total: 0,
                memberships: [],
            });
            // Add success
            mockAdminTeams.createMembership.mockResolvedValue({});

            const result = await invitePlayersServer({
                players,
                teamId,
                url,
                client: {
                    teams: mockSessionTeams,
                    account: mockSessionAccount,
                },
            });

            expect(mockAdminUsers.list).toHaveBeenCalled();
            expect(mockAdminTeams.createMembership).toHaveBeenCalledWith(
                teamId,
                ["player"],
                undefined,
                "existing-u1",
            );
            expect(result.success).toBe(true);
            expect(result.message).toContain(
                "Successfully invited/added 1 player",
            );
        });

        it("should handle error if user already in team", async () => {
            // User exists
            mockAdminUsers.list.mockResolvedValue({
                total: 1,
                users: [{ $id: "existing-u1", email: "test@example.com" }],
            });
            // User matches confirm true
            mockAdminTeams.listMemberships.mockResolvedValue({
                total: 1,
                memberships: [{ confirm: true }],
            });

            const result = await invitePlayersServer({
                players,
                teamId,
                url,
                client: {
                    teams: mockSessionTeams,
                    account: mockSessionAccount,
                },
            });

            expect(result.success).toBe(false);
            expect(result.errors).toContain("Player is already a member");
        });

        it("should send email invite for new users (via client.teams.createMembership)", async () => {
            // User does not exist
            mockAdminUsers.list.mockResolvedValue({ total: 0, users: [] });

            // Mock createMembership to simulate successful client invite
            mockSessionTeams.createMembership.mockResolvedValue({
                $id: "m1",
                userId: "u1",
            });

            const result = await invitePlayersServer({
                players,
                teamId,
                url,
                client: {
                    teams: mockSessionTeams,
                    account: mockSessionAccount,
                },
            });

            expect(mockSessionTeams.createMembership).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });
});
