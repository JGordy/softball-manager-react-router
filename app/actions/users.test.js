import {
    createPlayer,
    updateUser,
    updateAccountInfo,
    updatePassword,
    resetPassword,
} from "./users";
import { createDocument, updateDocument } from "@/utils/databases";
import { createSessionClient } from "@/utils/appwrite/server";
import { hasBadWords } from "@/utils/badWordsApi";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-user-id"),
    },
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

    describe("createPlayer", () => {
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
            });

            expect(createDocument).toHaveBeenCalledWith(
                "users",
                "unique-user-id",
                {
                    firstName: "John",
                    lastName: "Doe",
                    preferredPositions: ["1B", "OF"],
                    dislikedPositions: ["P", "C"],
                    userId: "unique-user-id",
                },
            );
            expect(createDocument).toHaveBeenCalledWith("memberships", null, {
                userId: "unique-user-id",
                teamId,
                role: "player",
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
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

            updateDocument.mockResolvedValue({ $id: userId });

            const result = await updateUser({ values: mockValues, userId });

            expect(updateDocument).toHaveBeenCalledWith("users", userId, {
                firstName: "Jane",
                preferredPositions: ["OF", "2B"],
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should reject update with bad words", async () => {
            hasBadWords.mockResolvedValue(true);

            const result = await updateUser({
                values: { firstName: "BadWord" },
                userId: "user1",
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
                request: {},
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
                request: {},
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
                request: {},
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
                request: {},
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
                request: {},
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
            const mockRequest = {
                url: "http://localhost:3000/settings",
            };

            const result = await resetPassword({
                values: mockValues,
                request: mockRequest,
            });

            expect(mockAccount.createRecovery).toHaveBeenCalledWith(
                "user@example.com",
                "http://localhost:3000/recovery",
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
        });
    });
});
