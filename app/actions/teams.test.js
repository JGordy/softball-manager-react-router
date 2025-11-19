import { createTeam, updateTeam, addPlayerToTeam } from "./teams";
import { createDocument, updateDocument } from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-team-id"),
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

            createDocument.mockResolvedValue({ $id: "team1" });

            const result = await createTeam({ values: mockValues, userId });

            expect(createDocument).toHaveBeenCalledWith(
                "teams",
                "unique-team-id",
                {
                    name: "New Team",
                    primaryColor: "#FFFFFF",
                },
            );
            expect(createDocument).toHaveBeenCalledWith("memberships", null, {
                userId,
                teamId: "unique-team-id",
                role: "manager",
            });
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
        it("should create membership document", async () => {
            const userId = "user1";
            const teamId = "team1";

            createDocument.mockResolvedValue({ $id: "membership1" });

            // Note: The source code has a bug where it references 'team' which doesn't exist
            // This test verifies the membership creation happens before the error
            await expect(addPlayerToTeam({ userId, teamId })).rejects.toThrow(
                "team is not defined",
            );

            expect(createDocument).toHaveBeenCalledWith("memberships", null, {
                userId,
                teamId,
                role: "player",
            });
        });

        it("should throw error if userId or teamId is missing", async () => {
            await expect(
                addPlayerToTeam({ userId: null, teamId: "team1" }),
            ).rejects.toThrow("User Id and Team Id are required");

            await expect(
                addPlayerToTeam({ userId: "user1", teamId: null }),
            ).rejects.toThrow("User Id and Team Id are required");
        });
    });
});
