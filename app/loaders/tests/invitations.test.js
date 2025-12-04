import { createAdminClient } from "@/utils/appwrite/server";

import { checkUserHasPassword } from "../invitations";

// Mock dependencies
jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
}));

// Note: This test needs custom Users class mock, so can't use __mocks__/node-appwrite.js
jest.mock("node-appwrite", () => ({
    Users: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
    })),
}));

describe("Invitations Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("checkUserHasPassword", () => {
        it("should return hasPassword true when user has a password", async () => {
            const { Users } = require("node-appwrite");
            const mockGet = jest.fn().mockResolvedValue({
                $id: "user-123",
                email: "player@example.com",
                name: "John Doe",
                password: true, // Has password
            });
            Users.mockImplementation(() => ({ get: mockGet }));

            createAdminClient.mockReturnValue({
                account: { client: {} },
            });

            const result = await checkUserHasPassword({ userId: "user-123" });

            expect(result.hasPassword).toBe(true);
            expect(result.user.id).toBe("user-123");
            expect(result.user.email).toBe("player@example.com");
            expect(result.user.name).toBe("John Doe");
        });

        it("should return hasPassword false when user has no password", async () => {
            const { Users } = require("node-appwrite");
            const mockGet = jest.fn().mockResolvedValue({
                $id: "user-456",
                email: "newplayer@example.com",
                name: "Jane Doe",
                password: false, // No password (invited user)
            });
            Users.mockImplementation(() => ({ get: mockGet }));

            createAdminClient.mockReturnValue({
                account: { client: {} },
            });

            const result = await checkUserHasPassword({ userId: "user-456" });

            expect(result.hasPassword).toBe(false);
            expect(result.user.id).toBe("user-456");
            expect(result.user.email).toBe("newplayer@example.com");
        });

        it("should return hasPassword false when password field is undefined", async () => {
            const { Users } = require("node-appwrite");
            const mockGet = jest.fn().mockResolvedValue({
                $id: "user-789",
                email: "another@example.com",
                name: "Bob Smith",
                // password field not present
            });
            Users.mockImplementation(() => ({ get: mockGet }));

            createAdminClient.mockReturnValue({
                account: { client: {} },
            });

            const result = await checkUserHasPassword({ userId: "user-789" });

            expect(result.hasPassword).toBe(false);
        });

        it("should call Users.get with correct userId", async () => {
            const { Users } = require("node-appwrite");
            const mockGet = jest.fn().mockResolvedValue({
                $id: "user-123",
                email: "test@example.com",
                name: "Test User",
                password: true,
            });
            Users.mockImplementation(() => ({ get: mockGet }));

            createAdminClient.mockReturnValue({
                account: { client: {} },
            });

            await checkUserHasPassword({ userId: "user-123" });

            expect(mockGet).toHaveBeenCalledWith({ userId: "user-123" });
        });

        it("should throw error when user is not found", async () => {
            const { Users } = require("node-appwrite");
            const mockGet = jest
                .fn()
                .mockRejectedValue(new Error("User not found"));
            Users.mockImplementation(() => ({ get: mockGet }));

            createAdminClient.mockReturnValue({
                account: { client: {} },
            });

            await expect(
                checkUserHasPassword({ userId: "invalid-user" }),
            ).rejects.toThrow("User not found");
        });

        it("should throw error with default message when error has no message", async () => {
            const { Users } = require("node-appwrite");
            const mockGet = jest.fn().mockRejectedValue(new Error());
            Users.mockImplementation(() => ({ get: mockGet }));

            createAdminClient.mockReturnValue({
                account: { client: {} },
            });

            await expect(
                checkUserHasPassword({ userId: "user-123" }),
            ).rejects.toThrow("Failed to check user status.");
        });
    });
});
