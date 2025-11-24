import { createTeam, updateTeam, addPlayerToTeam } from "../teams";
import { createDocument, updateDocument } from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";
import {
    createAppwriteTeam,
    addExistingUserToTeam,
    inviteNewMemberByEmail,
} from "@/utils/teams";

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
}));

jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-team-id"),
    },
    Permission: {
        read: jest.fn((role) => `read("${role}")`),
        update: jest.fn((role) => `update("${role}")`),
        delete: jest.fn((role) => `delete("${role}")`),
    },
    Role: {
        team: jest.fn((teamId, role) =>
            role ? `team:${teamId}/${role}` : `team:${teamId}`,
        ),
    },
}));

describe("Teams Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        hasBadWords.mockResolvedValue(false);
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

            createAppwriteTeam.mockResolvedValue({ $id: "unique-team-id" });
            addExistingUserToTeam.mockResolvedValue({
                $id: "membership1",
            });
            createDocument.mockResolvedValue({ $id: "unique-team-id" });

            const result = await createTeam({ values: mockValues, userId });

            // Should create Appwrite Team
            expect(createAppwriteTeam).toHaveBeenCalledWith({
                teamId: "unique-team-id",
                name: "New Team",
                roles: ["manager", "player", "coach"],
            });

            // Should add creator as owner/manager
            expect(addExistingUserToTeam).toHaveBeenCalledWith({
                teamId: "unique-team-id",
                userId,
                roles: ["owner", "manager"],
            });

            // Should create database record with permissions
            expect(createDocument).toHaveBeenCalledWith(
                "teams",
                "unique-team-id",
                {
                    name: "New Team",
                    primaryColor: "#FFFFFF",
                },
                [
                    'read("team:unique-team-id")',
                    'update("team:unique-team-id/manager")',
                    'delete("team:unique-team-id/manager")',
                ],
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

            const result = await updateTeam({ values: mockValues, teamId });

            expect(updateDocument).toHaveBeenCalledWith("teams", teamId, {
                name: "Updated Team",
            });
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
            ).rejects.toThrow("User Id or email and Team Id are required");

            await expect(
                addPlayerToTeam({ userId: "user1", teamId: null }),
            ).rejects.toThrow("User Id or email and Team Id are required");
        });
    });
});
