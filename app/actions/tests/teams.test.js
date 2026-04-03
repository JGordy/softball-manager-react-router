import {
    createAdminClient,
    createSessionClient,
} from "@/utils/appwrite/server";
import { createDocument, updateDocument } from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";
import {
    createAppwriteTeam,
    addExistingUserToTeam,
    inviteNewMemberByEmail,
    getTeamMembers,
    updateMembershipRoles,
    updateTeamPreferences,
} from "@/utils/teams";

import {
    createTeam,
    updateTeam,
    addPlayerToTeam,
    updateMemberRole,
    updateBulkJerseyNumbers,
    updatePreferences,
} from "../teams";
import { verifyManager } from "../utils/teamAuth.js";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("@/utils/teams", () => ({
    createAppwriteTeam: jest.fn(),
    addExistingUserToTeam: jest.fn(),
    inviteNewMemberByEmail: jest.fn(),
    getTeamMembers: jest.fn(),
    updateMembershipRoles: jest.fn(),
    updateTeamPreferences: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(() => ({
        teams: {
            getPrefs: jest.fn(),
            updatePrefs: jest.fn(),
        },
    })),
}));

jest.mock("../utils/teamAuth.js", () => ({
    verifyManager: jest.fn(),
}));

describe("Teams Actions", () => {
    const mockSessionClient = {
        tablesDB: { id: "mock-session-db" },
        account: { get: jest.fn().mockResolvedValue({ $id: "user1" }) },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        hasBadWords.mockResolvedValue(false);
        createSessionClient.mockResolvedValue(mockSessionClient);
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("createTeam", () => {
        it("should create team and membership successfully", async () => {
            const mockValues = {
                name: "New Team",
                primaryColor: "#FFFFFF",
            };
            const userId = "user1";

            createAppwriteTeam.mockResolvedValue({ $id: "unique-id" });
            addExistingUserToTeam.mockResolvedValue({
                $id: "membership1",
            });
            createDocument.mockResolvedValue({ $id: "unique-id" });

            const result = await createTeam({
                values: mockValues,
                userId,
                client: mockSessionClient,
            });

            // Should create Appwrite Team
            expect(createAppwriteTeam).toHaveBeenCalledWith({
                teamId: "unique-id",
                name: "New Team",
                roles: ["manager", "player", "coach"],
            });

            // Should add creator as owner/manager
            expect(addExistingUserToTeam).toHaveBeenCalledWith({
                teamId: "unique-id",
                userId,
                roles: ["owner", "manager"],
            });

            // Should create database record with permissions
            expect(createDocument).toHaveBeenCalledWith(
                "teams",
                "unique-id",
                {
                    name: "New Team",
                    primaryColor: "#FFFFFF",
                },
                [
                    'read("team:unique-id")',
                    'update("team:unique-id/manager")',
                    'delete("team:unique-id/manager")',
                ],
                mockSessionClient,
            );

            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should reject team with bad words in name", async () => {
            hasBadWords.mockResolvedValue(true);

            const mockValues = {
                name: "BadWord Team",
            };

            const result = await createTeam({
                values: mockValues,
                userId: "user1",
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(createDocument).not.toHaveBeenCalled();
        });
    });

    describe("updateTeam", () => {
        it("should update team successfully", async () => {
            const mockValues = {
                name: "Updated Team",
            };
            const teamId = "team1";

            updateDocument.mockResolvedValue({ $id: teamId });

            const result = await updateTeam({
                values: mockValues,
                teamId,
                client: mockSessionClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "teams",
                teamId,
                {
                    name: "Updated Team",
                },
                mockSessionClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });
    });

    describe("addPlayerToTeam", () => {
        it("should add existing user to team silently (no email)", async () => {
            const userId = "user1";
            const teamId = "team1";

            addExistingUserToTeam.mockResolvedValue({ $id: "membership1" });

            const result = await addPlayerToTeam({ userId, teamId });

            expect(addExistingUserToTeam).toHaveBeenCalledWith({
                teamId,
                userId,
                roles: ["player"],
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.message).toBe("Player added to team successfully");
        });

        it("should send invitation email when only email is provided", async () => {
            const email = "newplayer@example.com";
            const teamId = "team1";
            const name = "New Player";

            inviteNewMemberByEmail.mockResolvedValue({ $id: "membership1" });

            const result = await addPlayerToTeam({ email, teamId, name });

            expect(inviteNewMemberByEmail).toHaveBeenCalledWith({
                teamId,
                email,
                roles: ["player"],
                name,
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.message).toBe("Invitation email sent to player");
        });

        it("should throw error if userId or email and teamId is missing", async () => {
            await expect(
                addPlayerToTeam({ userId: null, email: null, teamId: "team1" }),
            ).rejects.toThrow(
                "Either userId or email must be provided, along with teamId",
            );

            await expect(
                addPlayerToTeam({ userId: "user1", teamId: null }),
            ).rejects.toThrow(
                "Either userId or email must be provided, along with teamId",
            );
        });
    });

    describe("updateMemberRole", () => {
        let mockRequest;
        let mockAccount;
        let mockCreateSessionClient;

        beforeEach(async () => {
            // Mock the request object
            mockRequest = { headers: { get: () => "mock-cookie" } };

            // Mock the account.get() response
            mockAccount = {
                get: jest.fn().mockResolvedValue({ $id: "owner-user-id" }),
            };

            mockSessionClient.account = mockAccount;

            // Mock createSessionClient
            createSessionClient.mockResolvedValue({
                account: mockAccount,
            });
        });

        it("should update role to owner", async () => {
            const teamId = "team1";
            const userId = "user1";
            const membershipId = "membership1";
            const ownerMembershipId = "owner-membership-id";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId, $id: membershipId, roles: ["player"] },
                    {
                        userId: "owner-user-id",
                        $id: ownerMembershipId,
                        roles: ["owner"],
                    },
                ],
            });
            updateMembershipRoles.mockResolvedValue({});

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "owner" },
                client: mockSessionClient,
            });

            expect(getTeamMembers).toHaveBeenCalledWith({ teamId });
            expect(updateMembershipRoles).toHaveBeenCalledWith({
                teamId,
                membershipId,
                roles: ["owner", "manager", "scorekeeper", "player"],
            });
            expect(result.success).toBe(true);
            expect(result.message).toBe("Member role updated successfully");
        });

        it("should update role to manager", async () => {
            const teamId = "team1";
            const userId = "user1";
            const membershipId = "membership1";
            const ownerMembershipId = "owner-membership-id";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId, $id: membershipId, roles: ["player"] },
                    {
                        userId: "owner-user-id",
                        $id: ownerMembershipId,
                        roles: ["owner"],
                    },
                ],
            });
            updateMembershipRoles.mockResolvedValue({});

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "manager" },
                client: mockSessionClient,
            });

            expect(updateMembershipRoles).toHaveBeenCalledWith({
                teamId,
                membershipId,
                roles: ["manager", "scorekeeper", "player"],
            });
            expect(result.success).toBe(true);
        });

        it("should update role to scorekeeper", async () => {
            const teamId = "team1";
            const userId = "user1";
            const membershipId = "membership1";
            const ownerMembershipId = "owner-membership-id";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId, $id: membershipId, roles: ["player"] },
                    {
                        userId: "owner-user-id",
                        $id: ownerMembershipId,
                        roles: ["owner"],
                    },
                ],
            });
            updateMembershipRoles.mockResolvedValue({});

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "scorekeeper" },
                client: mockSessionClient,
            });

            expect(updateMembershipRoles).toHaveBeenCalledWith({
                teamId,
                membershipId,
                roles: ["scorekeeper", "player"],
            });
            expect(result.success).toBe(true);
        });

        it("should update role to player", async () => {
            const teamId = "team1";
            const userId = "user1";
            const membershipId = "membership1";
            const ownerMembershipId = "owner-membership-id";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId, $id: membershipId, roles: ["owner", "manager"] },
                    {
                        userId: "owner-user-id",
                        $id: ownerMembershipId,
                        roles: ["owner"],
                    },
                ],
            });
            updateMembershipRoles.mockResolvedValue({});

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "player" },
                client: mockSessionClient,
            });

            expect(updateMembershipRoles).toHaveBeenCalledWith({
                teamId,
                membershipId,
                roles: ["player"],
            });
            expect(result.success).toBe(true);
        });

        it("should return error if membership not found", async () => {
            const teamId = "team1";
            const userId = "user1";
            const ownerMembershipId = "owner-membership-id";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    {
                        userId: "owner-user-id",
                        $id: ownerMembershipId,
                        roles: ["owner"],
                    },
                ],
            });

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "manager" },
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("Membership not found");
            expect(updateMembershipRoles).not.toHaveBeenCalled();
        });

        it("should return error if requesting user is not an owner", async () => {
            const teamId = "team1";
            const userId = "user1";
            const membershipId = "membership1";
            const managerMembershipId = "manager-membership-id";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId, $id: membershipId, roles: ["player"] },
                    {
                        userId: "owner-user-id",
                        $id: managerMembershipId,
                        roles: ["manager"],
                    },
                ],
            });

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "manager" },
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe(
                "Only team owners can change member roles",
            );
            expect(updateMembershipRoles).not.toHaveBeenCalled();
        });

        it("should return error for invalid role", async () => {
            const teamId = "team1";
            const userId = "user1";

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "invalid-role" },
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("Invalid role");
            expect(getTeamMembers).not.toHaveBeenCalled();
            expect(updateMembershipRoles).not.toHaveBeenCalled();
        });

        it("should prevent last owner from demoting themselves", async () => {
            const teamId = "team1";
            const userId = "owner-user-id";
            const membershipId = "membership1";

            getTeamMembers.mockResolvedValue({
                memberships: [
                    { userId, $id: membershipId, roles: ["owner"] },
                    {
                        userId: "user2",
                        $id: "membership2",
                        roles: ["player"],
                    },
                ],
            });

            const result = await updateMemberRole({
                teamId,
                values: { playerId: userId, role: "player" },
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("last owner");
            expect(updateMembershipRoles).not.toHaveBeenCalled();
        });
    });

    describe("updateBulkJerseyNumbers", () => {
        const teamId = "team123";
        const mockValues = {
            "jerseyNumber[p1]": "10",
            "jerseyNumber[p2]": "22",
        };

        it("should update bulk jersey numbers successfully with manager permission", async () => {
            verifyManager.mockResolvedValue({
                success: true,
                user: { $id: "user1" },
            });

            const mockTeamsApi = {
                getPrefs: jest.fn().mockResolvedValue({}),
                updatePrefs: jest.fn().mockResolvedValue({}),
            };
            createAdminClient.mockReturnValue({ teams: mockTeamsApi });

            const result = await updateBulkJerseyNumbers({
                teamId,
                values: mockValues,
                client: mockSessionClient,
            });

            expect(mockTeamsApi.updatePrefs).toHaveBeenCalledWith(teamId, {
                jerseyNumbers: {
                    p1: "10",
                    p2: "22",
                },
            });
            expect(result.success).toBe(true);
        });

        it("should return error if verifyManager fails", async () => {
            verifyManager.mockResolvedValue({
                success: false,
                message: "No permission",
            });

            const result = await updateBulkJerseyNumbers({
                teamId,
                values: mockValues,
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("No permission");
        });
    });

    describe("updatePreferences", () => {
        it("should call updateTeamPreferences with correct args", async () => {
            updateTeamPreferences.mockResolvedValue({ success: true });

            const teamId = "team1";
            const prefs = { maxMaleBatters: 3 };

            const result = await updatePreferences({ teamId, prefs });

            expect(updateTeamPreferences).toHaveBeenCalledWith(teamId, prefs);
            expect(result).toEqual({ success: true });
        });
    });
});
