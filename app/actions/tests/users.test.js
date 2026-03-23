import { Permission, Role } from "node-appwrite";

import {
    createPlayer,
    updateUser,
    updateAccountInfo,
    updatePassword,
    resetPassword,
    updateUserPrefs,
} from "../users";
import {
    createDocument,
    updateDocument,
    readDocument,
} from "@/utils/databases";
import { createSessionClient } from "@/utils/appwrite/server";
import { hasBadWords } from "@/utils/badWordsApi";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

describe("Users Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        hasBadWords.mockResolvedValue(false);
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    const mockClient = { tablesDB: { id: "mock-session-db" } };

    describe("createPlayer", () => {
        beforeEach(() => {
            createSessionClient.mockResolvedValue(mockClient);
        });

        it("should create player successfully", async () => {
            const mockValues = {
                firstName: "John",
                lastName: "Doe",
                preferredPositions: "1B,OF",
                dislikedPositions: "P,C",
            };
            const teamId = "team1";

            createDocument.mockResolvedValue({ $id: "user1" });

            const result = await createPlayer({
                values: mockValues,
                teamId,
                userId: null,
                client: mockClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "users",
                "unique-id",
                {
                    firstName: "John",
                    lastName: "Doe",
                    preferredPositions: ["1B", "OF"],
                    dislikedPositions: ["P", "C"],
                    userId: "unique-id",
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user("unique-id")),
                    Permission.delete(Role.user("unique-id")),
                ],
                expect.any(Object),
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should remove overlaps between preferred and disliked positions", async () => {
            const mockValues = {
                firstName: "Overlap",
                lastName: "Player",
                preferredPositions: "P,C",
                dislikedPositions: "C,OF",
            };
            const teamId = "team1";

            createDocument.mockResolvedValue({ $id: "user1" });

            await createPlayer({
                values: mockValues,
                teamId,
                userId: "user123",
                client: mockClient,
            });

            expect(createDocument).toHaveBeenCalledWith(
                "users",
                "user123",
                {
                    firstName: "Overlap",
                    lastName: "Player",
                    preferredPositions: ["P", "C"],
                    dislikedPositions: ["OF"], // C was removed
                    userId: "user123",
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user("user123")),
                    Permission.delete(Role.user("user123")),
                ],
                expect.any(Object),
            );
        });

        it("should reject player with bad words in first name", async () => {
            hasBadWords.mockResolvedValue(true);

            const mockValues = {
                firstName: "BadWord",
                lastName: "Doe",
                preferredPositions: "1B",
                dislikedPositions: "P",
            };

            const result = await createPlayer({
                values: mockValues,
                teamId: "team1",
                client: mockClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });

        it("should reject player with bad words in last name", async () => {
            hasBadWords
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(true);

            const mockValues = {
                firstName: "John",
                lastName: "BadWord",
                preferredPositions: "1B",
                dislikedPositions: "P",
            };

            const result = await createPlayer({
                values: mockValues,
                teamId: "team1",
                client: mockClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });
    });

    describe("updateUser", () => {
        it("should update user successfully", async () => {
            const mockValues = {
                firstName: "Jane",
                preferredPositions: "OF,2B",
            };
            const userId = "user1";

            readDocument.mockResolvedValue({
                $id: userId,
                firstName: "Old",
            });

            updateDocument.mockResolvedValue({
                $id: userId,
                firstName: "Jane",
                preferredPositions: ["OF", "2B"],
            });

            const result = await updateUser({
                values: mockValues,
                userId,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "users",
                userId,
                {
                    firstName: "Jane",
                    preferredPositions: ["OF", "2B"],
                },
                mockClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
            expect(result.event).toEqual({
                name: "player-profile-updated",
                data: { userId: "user1" },
            });
        });

        it("should remove overlaps when updating both preferred and disliked positions", async () => {
            const mockValues = {
                preferredPositions: "1B,SS",
                dislikedPositions: "SS,P",
            };
            const userId = "user1";

            readDocument.mockResolvedValue({ $id: userId });
            updateDocument.mockResolvedValue({ $id: userId });

            await updateUser({
                values: mockValues,
                userId,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "users",
                userId,
                {
                    preferredPositions: ["1B", "SS"],
                    dislikedPositions: ["P"], // SS was removed
                },
                mockClient,
            );
        });

        it("should remove overlaps when only updating preferredPositions and they overlap with existing dislikedPositions", async () => {
            const userId = "user1";
            const mockValues = {
                preferredPositions: "SS,3B",
            };

            // Existing user has SS in disliked
            readDocument.mockResolvedValue({
                $id: userId,
                dislikedPositions: ["SS", "OF"],
            });
            updateDocument.mockResolvedValue({ $id: userId });

            await updateUser({
                values: mockValues,
                userId,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "users",
                userId,
                {
                    preferredPositions: ["SS", "3B"],
                    dislikedPositions: ["OF"], // SS was removed
                },
                mockClient,
            );
        });

        it("should remove overlaps when only updating dislikedPositions and they overlap with existing preferredPositions", async () => {
            const userId = "user1";
            const mockValues = {
                dislikedPositions: "C,P",
            };

            // Existing user has C in preferred
            readDocument.mockResolvedValue({
                $id: userId,
                preferredPositions: ["C", "1B"],
            });
            updateDocument.mockResolvedValue({ $id: userId });

            await updateUser({
                values: mockValues,
                userId,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "users",
                userId,
                {
                    dislikedPositions: ["P"], // C was removed because it's in preferred
                },
                mockClient,
            );
        });

        it("should emit player-profile-completed when profile becomes complete", async () => {
            const mockValues = {
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: "1B",
                phoneNumber: "123-456-7890",
            };
            const userId = "user1";

            // User was missing fields before
            readDocument.mockResolvedValue({
                $id: userId,
                email: "test@example.com",
            });

            // User is now complete
            updateDocument.mockResolvedValue({
                $id: userId,
                email: "test@example.com",
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: ["1B"],
                phoneNumber: "123-456-7890",
            });

            const result = await updateUser({
                values: mockValues,
                userId,
                client: mockClient,
            });

            expect(result.event).toEqual({
                name: "player-profile-completed",
                data: { userId: "user1" },
            });
        });

        it("should emit player-profile-updated if profile was ALREADY complete", async () => {
            const mockValues = {
                firstName: "New Name",
            };
            const userId = "user1";

            // User was already complete
            const completeUser = {
                $id: userId,
                email: "test@example.com",
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: ["1B"],
                phoneNumber: "123-456-7890",
            };

            readDocument.mockResolvedValue(completeUser);

            // User remains complete
            updateDocument.mockResolvedValue({
                ...completeUser,
                firstName: "New Name",
            });

            const result = await updateUser({
                values: mockValues,
                userId,
                client: mockClient,
            });

            expect(result.event).toEqual({
                name: "player-profile-updated",
                data: { userId: "user1" },
            });
        });

        it("should reject update with bad words", async () => {
            hasBadWords.mockResolvedValue(true);

            const result = await updateUser({
                values: { firstName: "BadWord" },
                userId: "user1",
                client: mockClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });
    });

    describe("updateAccountInfo", () => {
        it("should update email successfully", async () => {
            const mockAccount = {
                updateEmail: jest.fn().mockResolvedValue({}),
                updatePhone: jest.fn(),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });
            updateDocument.mockResolvedValue({});

            const mockValues = {
                user: JSON.stringify({
                    $id: "user1",
                    email: "old@example.com",
                }),
                email: "new@example.com",
                password: "password123",
            };

            const result = await updateAccountInfo({
                values: mockValues,
                client: await createSessionClient(),
            });

            expect(mockAccount.updateEmail).toHaveBeenCalledWith(
                "new@example.com",
                "password123",
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should update phone number successfully", async () => {
            const mockAccount = {
                updateEmail: jest.fn(),
                updatePhone: jest.fn().mockResolvedValue({}),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });
            updateDocument.mockResolvedValue({});

            const mockValues = {
                user: JSON.stringify({
                    $id: "user1",
                    phoneNumber: "1234567890",
                }),
                phoneNumber: "9876543210",
                password: "password123",
            };

            const result = await updateAccountInfo({
                values: mockValues,
                client: await createSessionClient(),
            });

            expect(mockAccount.updatePhone).toHaveBeenCalledWith(
                "+19876543210",
                "password123",
            );
            expect(result.success).toBe(true);
        });

        it("should handle errors gracefully", async () => {
            const mockAccount = {
                updateEmail: jest
                    .fn()
                    .mockRejectedValue(new Error("Auth error")),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const mockValues = {
                user: JSON.stringify({
                    $id: "user1",
                    email: "old@example.com",
                }),
                email: "new@example.com",
                password: "password123",
            };

            const result = await updateAccountInfo({
                values: mockValues,
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
        });
    });

    describe("updatePassword", () => {
        it("should update password successfully", async () => {
            const mockAccount = {
                updatePassword: jest.fn().mockResolvedValue({}),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const mockValues = {
                currentPassword: "oldpass",
                newPassword: "newpass",
            };

            const result = await updatePassword({
                values: mockValues,
                client: await createSessionClient(),
            });

            expect(mockAccount.updatePassword).toHaveBeenCalledWith(
                "newpass",
                "oldpass",
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should handle errors", async () => {
            const mockAccount = {
                updatePassword: jest
                    .fn()
                    .mockRejectedValue(new Error("Password error")),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const result = await updatePassword({
                values: { currentPassword: "old", newPassword: "new" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
        });
    });

    describe("resetPassword", () => {
        it("should send password reset email", async () => {
            const mockAccount = {
                createRecovery: jest.fn().mockResolvedValue({}),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const mockValues = {
                email: "user@example.com",
            };

            const result = await resetPassword({
                values: mockValues,
                client: { account: mockAccount },
                requestUrl: "http://localhost:3000/settings",
            });

            expect(mockAccount.createRecovery).toHaveBeenCalledWith(
                "user@example.com",
                "http://localhost:3000/recovery",
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
        });
    });

    describe("updateUserPrefs", () => {
        it("should update user preferences successfully", async () => {
            const mockAccount = {
                get: jest.fn().mockResolvedValue({ prefs: {} }),
                updatePrefs: jest
                    .fn()
                    .mockResolvedValue({ prefs: { startingPage: "/events" } }),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const mockValues = { startingPage: "/events" };
            const result = await updateUserPrefs({
                values: mockValues,
                client: await createSessionClient(),
            });

            expect(mockAccount.updatePrefs).toHaveBeenCalledWith({
                prefs: {
                    startingPage: "/events",
                },
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should reject invalid preference keys", async () => {
            const result = await updateUserPrefs({
                values: { invalidKey: "some-value" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(result.message).toBe("Invalid preference key provided.");
            expect(result.action).toBe("update-user-prefs");
        });

        it("should reject invalid themePreference values", async () => {
            const result = await updateUserPrefs({
                values: { themePreference: "invalid-theme" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(result.message).toBe("Invalid theme preference.");
        });

        it("should reject empty themePreference values", async () => {
            const result = await updateUserPrefs({
                values: { themePreference: "" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(result.message).toBe("Invalid theme preference.");
        });

        it("should reject invalid startingPage values", async () => {
            const result = await updateUserPrefs({
                values: { startingPage: "invalid-path" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(result.message).toBe("Invalid starting page.");
        });

        it("should reject empty startingPage values", async () => {
            const result = await updateUserPrefs({
                values: { startingPage: "" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(result.message).toBe("Invalid starting page.");
        });

        it("should handle preference update errors", async () => {
            const mockAccount = {
                get: jest.fn().mockResolvedValue({ prefs: {} }),
                updatePrefs: jest
                    .fn()
                    .mockRejectedValue(new Error("Prefs error")),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const result = await updateUserPrefs({
                values: { startingPage: "/events" },
                client: await createSessionClient(),
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
            expect(result.action).toBe("update-user-prefs");
        });
    });
});
