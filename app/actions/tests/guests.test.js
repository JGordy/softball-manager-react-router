import { convertGuestToMember } from "../guests";

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((k, v) => ({ key: k, value: v })),
        limit: jest.fn((v) => ({ limit: v })),
    },
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
}));

const mockCreateAdminClient = jest.fn();
jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: () => mockCreateAdminClient(),
}));

const mockCreateDocument = jest.fn().mockResolvedValue({});
const mockReadDocument = jest.fn();
const mockListDocuments = jest.fn().mockResolvedValue({ rows: [] });
const mockUpdateDocument = jest.fn().mockResolvedValue({});
const mockDeleteDocument = jest.fn().mockResolvedValue({});

jest.mock("@/utils/databases", () => ({
    createDocument: (...args) => mockCreateDocument(...args),
    readDocument: (...args) => mockReadDocument(...args),
    listDocuments: (...args) => mockListDocuments(...args),
    updateDocument: (...args) => mockUpdateDocument(...args),
    deleteDocument: (...args) => mockDeleteDocument(...args),
}));

const mockVerifyManager = jest.fn();
jest.mock("@/actions/utils/teamAuth", () => ({
    verifyManager: (...args) => mockVerifyManager(...args),
}));

const mockAddPlayersToSeasonRoster = jest
    .fn()
    .mockResolvedValue({ success: true });
jest.mock("@/actions/rosterHistory", () => ({
    addPlayersToSeasonRoster: (...args) =>
        mockAddPlayersToSeasonRoster(...args),
}));

describe("convertGuestToMember Action", () => {
    let mockClient;
    let mockAdminClient;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {};

        mockAdminClient = {
            users: {
                list: jest.fn().mockResolvedValue({ users: [] }),
            },
            teams: {
                listMemberships: jest.fn().mockResolvedValue({
                    memberships: [],
                }),
            },
        };
        mockCreateAdminClient.mockReturnValue(mockAdminClient);

        mockVerifyManager.mockResolvedValue({
            success: true,
            user: { $id: "manager-1" },
        });
        mockReadDocument.mockRejectedValue(new Error("Document not found"));
    });

    it("fails if missing required arguments", async () => {
        const result = await convertGuestToMember({
            guestPlayerId: "",
            teamId: "team-1",
            email: "test@example.com",
            client: mockClient,
        });
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
    });

    it("fails if invalid email is provided", async () => {
        const result = await convertGuestToMember({
            guestPlayerId: "guest-1",
            teamId: "team-1",
            email: "invalid-email",
            client: mockClient,
        });
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
    });

    it("fails if user is not a manager/owner", async () => {
        mockVerifyManager.mockResolvedValueOnce({
            success: false,
            message: "Unauthorized",
        });

        const result = await convertGuestToMember({
            guestPlayerId: "guest-1",
            teamId: "team-1",
            email: "guest@example.com",
            client: mockClient,
        });

        expect(result.success).toBe(false);
        expect(result.status).toBe(403);
    });

    it("successfully attributes logs, games, and stats when newUserId is provided", async () => {
        mockReadDocument.mockImplementation((collection, id) => {
            if (collection === "users" && id === "guest-1") {
                return Promise.resolve({
                    $id: "guest-1",
                    firstName: "Guest",
                    lastName: "Player",
                    gender: "Male",
                    isTemporary: true,
                });
            }
            if (collection === "users" && id === "new-user-123") {
                return Promise.reject(new Error("Not found"));
            }
            return Promise.reject(new Error("Not found"));
        });

        mockListDocuments.mockImplementation((collection) => {
            if (collection === "game_logs") {
                return Promise.resolve({
                    rows: [
                        { $id: "log-1", playerId: "guest-1", eventType: "1B" },
                        { $id: "log-2", playerId: "guest-1", eventType: "2B" },
                    ],
                });
            }
            if (collection === "seasons") {
                return Promise.resolve({
                    rows: [{ $id: "season-1", endDate: "2099-12-31" }],
                });
            }
            if (collection === "games") {
                return Promise.resolve({
                    rows: [
                        {
                            $id: "game-1",
                            playerChart: JSON.stringify([
                                {
                                    $id: "guest-1",
                                    firstName: "Guest",
                                    lastName: "Player",
                                },
                            ]),
                        },
                    ],
                });
            }
            return Promise.resolve({ rows: [] });
        });

        const result = await convertGuestToMember({
            guestPlayerId: "guest-1",
            teamId: "team-1",
            email: "guest@example.com",
            firstName: "John",
            lastName: "Doe",
            gender: "Male",
            newUserId: "new-user-123",
            client: mockClient,
        });

        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
        expect(result.player.userId).toBe("new-user-123");

        // Verify permanent user was created
        expect(mockCreateDocument).toHaveBeenCalledWith(
            "users",
            "new-user-123",
            expect.objectContaining({
                email: "guest@example.com",
                firstName: "John",
                lastName: "Doe",
                gender: "Male",
                status: "unverified",
                isTemporary: false,
            }),
            expect.any(Array),
            mockAdminClient,
        );

        // Verify game logs were migrated
        expect(mockUpdateDocument).toHaveBeenCalledWith(
            "game_logs",
            "log-1",
            { playerId: "new-user-123" },
            mockAdminClient,
        );
        expect(mockUpdateDocument).toHaveBeenCalledWith(
            "game_logs",
            "log-2",
            { playerId: "new-user-123" },
            mockAdminClient,
        );

        // Verify game playerChart was updated
        expect(mockUpdateDocument).toHaveBeenCalledWith(
            "games",
            "game-1",
            expect.objectContaining({
                playerChart: expect.stringContaining("new-user-123"),
            }),
            mockAdminClient,
        );

        // Verify old guest doc was deleted
        expect(mockDeleteDocument).toHaveBeenCalledWith(
            "users",
            "guest-1",
            mockAdminClient,
        );

        // Verify added to active season roster
        expect(mockAddPlayersToSeasonRoster).toHaveBeenCalledWith({
            playerIds: ["new-user-123"],
            teamId: "team-1",
            seasonId: "season-1",
            client: mockAdminClient,
        });
    });

    it("resolves existing user via user list lookup if newUserId was not provided", async () => {
        mockAdminClient.users.list.mockResolvedValueOnce({
            users: [
                { $id: "existing-user-456", email: "existing@example.com" },
            ],
        });

        mockReadDocument.mockResolvedValueOnce({
            $id: "guest-1",
            firstName: "Guest",
            lastName: "Player",
        });

        const result = await convertGuestToMember({
            guestPlayerId: "guest-1",
            teamId: "team-1",
            email: "existing@example.com",
            client: mockClient,
        });

        expect(result.success).toBe(true);
        expect(result.player.userId).toBe("existing-user-456");
    });
});
