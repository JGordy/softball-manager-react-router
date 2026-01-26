import {
    createAppwriteTeam,
    addTeamMember,
    addExistingUserToTeam,
    inviteNewMemberByEmail,
    getTeamMembers,
    updateMembershipRoles,
    removeTeamMember,
    getNotifiableTeamMembers,
} from "../teams";
import { createAdminClient } from "@/utils/appwrite/server";

// Mock dependencies
jest.mock("@/utils/appwrite/server");

describe("teams utility", () => {
    const mockTeams = {
        create: jest.fn(),
        createMembership: jest.fn(),
        listMemberships: jest.fn(),
        updateMembership: jest.fn(),
        deleteMembership: jest.fn(),
        get: jest.fn(),
        updateName: jest.fn(),
        delete: jest.fn(),
    };

    const mockMessaging = {
        createTopic: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});

        createAdminClient.mockReturnValue({
            teams: mockTeams,
            messaging: mockMessaging,
        });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("createAppwriteTeam", () => {
        it("should create a team with provided ID and create a topic", async () => {
            const teamData = {
                $id: "team123",
                name: "Test Team",
            };

            mockTeams.create.mockResolvedValue(teamData);
            mockMessaging.createTopic.mockResolvedValue({});

            const result = await createAppwriteTeam({
                teamId: "team123",
                name: "Test Team",
                roles: ["manager", "player"],
            });

            expect(mockTeams.create).toHaveBeenCalledWith(
                "team123",
                "Test Team",
                ["manager", "player"],
            );
            // Verify topic creation
            // Assuming buildTeamTopic returns `team_${teamId}` or similar.
            // Since we didn't mock buildTeamTopic explicitly, it runs the real one?
            // Wait, buildTeamTopic is imported at top. Jest doesn't automatically mock utils unless told.
            // If real implementation runs, it might be fine if it's pure logic.
            // But let's check expectation.
            expect(mockMessaging.createTopic).toHaveBeenCalledWith(
                expect.stringContaining("team123"),
                "Test Team",
            );

            expect(result).toEqual(teamData);
        });

        it("should create a team with default roles if not provided", async () => {
            const teamData = {
                $id: "unique-id",
                name: "Test Team",
            };

            mockTeams.create.mockResolvedValue(teamData);

            await createAppwriteTeam({
                teamId: "unique-id",
                name: "Test Team",
            });

            expect(mockTeams.create).toHaveBeenCalledWith(
                "unique-id",
                "Test Team",
                ["manager", "player"], // default roles
            );
        });

        it("should handle errors when team creation fails", async () => {
            const error = new Error("Team creation failed");
            mockTeams.create.mockRejectedValue(error);

            await expect(
                createAppwriteTeam({
                    teamId: "team123",
                    name: "Test Team",
                }),
            ).rejects.toThrow("Team creation failed");

            expect(console.error).toHaveBeenCalledWith(
                "Error creating Appwrite team:",
                error,
            );
        });
    });

    describe("addTeamMember", () => {
        it("should add member with userId (silent add)", async () => {
            const membership = {
                $id: "membership123",
                userId: "user123",
                roles: ["player"],
            };

            mockTeams.createMembership.mockResolvedValue(membership);

            const result = await addTeamMember({
                teamId: "team123",
                roles: ["player"],
                userId: "user123",
            });

            expect(mockTeams.createMembership).toHaveBeenCalledWith(
                "team123",
                ["player"],
                undefined, // email
                "user123", // userId
                undefined, // phone
                undefined, // url
                undefined, // name
            );
            expect(result).toEqual(membership);
        });

        it("should add member with email (sends invitation)", async () => {
            const membership = {
                $id: "membership123",
                email: "player@example.com",
                roles: ["player"],
            };

            mockTeams.createMembership.mockResolvedValue(membership);

            const result = await addTeamMember({
                teamId: "team123",
                roles: ["player"],
                email: "player@example.com",
                name: "John Doe",
                url: "https://example.com/accept",
            });

            expect(mockTeams.createMembership).toHaveBeenCalledWith(
                "team123",
                ["player"],
                "player@example.com",
                undefined, // no userId
                undefined, // phone
                "https://example.com/accept",
                "John Doe",
            );
            expect(result).toEqual(membership);
        });

        it("should handle errors when adding member fails", async () => {
            const error = new Error("Add member failed");
            mockTeams.createMembership.mockRejectedValue(error);

            await expect(
                addTeamMember({
                    teamId: "team123",
                    roles: ["player"],
                    userId: "user123",
                }),
            ).rejects.toThrow("Add member failed");

            expect(console.error).toHaveBeenCalledWith(
                "Error adding team member:",
                error,
            );
        });
    });

    describe("addExistingUserToTeam", () => {
        it("should add existing user without email", async () => {
            const membership = {
                $id: "membership123",
                userId: "user123",
                roles: ["player"],
            };

            mockTeams.createMembership.mockResolvedValue(membership);

            const result = await addExistingUserToTeam({
                teamId: "team123",
                userId: "user123",
                roles: ["player"],
            });

            expect(mockTeams.createMembership).toHaveBeenCalledWith(
                "team123",
                ["player"],
                undefined, // email explicitly undefined
                "user123",
                undefined,
                undefined,
                undefined,
            );
            expect(result).toEqual(membership);
        });
    });

    describe("inviteNewMemberByEmail", () => {
        it("should invite member by email without userId", async () => {
            const membership = {
                $id: "membership123",
                email: "newplayer@example.com",
                roles: ["player"],
            };

            mockTeams.createMembership.mockResolvedValue(membership);

            const result = await inviteNewMemberByEmail({
                teamId: "team123",
                email: "newplayer@example.com",
                roles: ["player"],
                name: "New Player",
            });

            expect(mockTeams.createMembership).toHaveBeenCalledWith(
                "team123",
                ["player"],
                "newplayer@example.com",
                undefined, // userId explicitly undefined to trigger email
                undefined,
                "http://localhost:5173/teams/accept-invite", // default URL from env or fallback
                "New Player",
            );
            expect(result).toEqual(membership);
        });
    });

    describe("getTeamMembers", () => {
        it("should list team memberships", async () => {
            const memberships = {
                memberships: [
                    { $id: "m1", userId: "u1", roles: ["owner"] },
                    { $id: "m2", userId: "u2", roles: ["player"] },
                ],
            };

            mockTeams.listMemberships.mockResolvedValue(memberships);

            const result = await getTeamMembers({ teamId: "team123" });

            expect(mockTeams.listMemberships).toHaveBeenCalledWith(
                "team123",
                undefined,
                undefined,
            );
            expect(result).toEqual(memberships);
        });

        it("should handle errors when listing members fails", async () => {
            const error = new Error("List failed");
            mockTeams.listMemberships.mockRejectedValue(error);

            await expect(getTeamMembers({ teamId: "team123" })).rejects.toThrow(
                "List failed",
            );

            expect(console.error).toHaveBeenCalledWith(
                "Error getting team members:",
                error,
            );
        });
    });

    describe("updateMembershipRoles", () => {
        it("should update membership roles", async () => {
            const updatedMembership = {
                $id: "membership123",
                roles: ["owner", "manager"],
            };

            mockTeams.updateMembership.mockResolvedValue(updatedMembership);

            const result = await updateMembershipRoles({
                teamId: "team123",
                membershipId: "membership123",
                roles: ["owner", "manager"],
            });

            expect(mockTeams.updateMembership).toHaveBeenCalledWith(
                "team123",
                "membership123",
                ["owner", "manager"],
            );
            expect(result).toEqual(updatedMembership);
        });

        it("should handle errors when updating roles fails", async () => {
            const error = new Error("Update failed");
            mockTeams.updateMembership.mockRejectedValue(error);

            await expect(
                updateMembershipRoles({
                    teamId: "team123",
                    membershipId: "membership123",
                    roles: ["manager"],
                }),
            ).rejects.toThrow("Update failed");

            expect(console.error).toHaveBeenCalledWith(
                "Error updating membership roles:",
                error,
            );
        });
    });

    describe("removeTeamMember", () => {
        it("should remove team member", async () => {
            mockTeams.deleteMembership.mockResolvedValue(undefined);

            const result = await removeTeamMember({
                teamId: "team123",
                membershipId: "membership123",
            });

            expect(mockTeams.deleteMembership).toHaveBeenCalledWith(
                "team123",
                "membership123",
            );
            expect(result).toEqual({ success: true });
        });

        it("should handle errors when removing member fails", async () => {
            const error = new Error("Delete failed");
            mockTeams.deleteMembership.mockRejectedValue(error);

            await expect(
                removeTeamMember({
                    teamId: "team123",
                    membershipId: "membership123",
                }),
            ).rejects.toThrow("Delete failed");

            expect(console.error).toHaveBeenCalledWith(
                "Error removing team member:",
                error,
            );
        });
    });

    describe("getNotifiableTeamMembers", () => {
        it("should return array of user IDs from memberships", async () => {
            const teamId = "team123";
            const mockMemberships = {
                memberships: [
                    { userId: "user1", email: "user1@example.com" },
                    { userId: "user2", email: "user2@example.com" },
                    { userId: null, email: "pending@example.com" }, // Pending member
                ],
            };

            mockTeams.listMemberships.mockResolvedValue(mockMemberships);

            const result = await getNotifiableTeamMembers(teamId);

            expect(mockTeams.listMemberships).toHaveBeenCalledWith(
                teamId,
                undefined,
                undefined,
            );
            expect(result).toEqual(["user1", "user2"]);
        });

        it("should return an empty array if an error occurs", async () => {
            const teamId = "team123";
            const error = new Error("Appwrite error");
            mockTeams.listMemberships.mockRejectedValue(error);

            const result = await getNotifiableTeamMembers(teamId);

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                "Error getting team members for notifications:",
                error,
            );
        });
    });
});
