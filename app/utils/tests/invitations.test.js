import { inviteUserByEmail } from "../invitations";
import { createAdminClient } from "@/utils/appwrite/server";
import { createDocument, listDocuments } from "@/utils/databases";
import { addExistingUserToTeam } from "@/utils/teams";

// Mock dependencies
jest.mock("@/utils/appwrite/server");
jest.mock("@/utils/databases");
jest.mock("@/utils/teams");
jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-user-id"),
    },
    Query: {
        equal: jest.fn((field, value) => `Query.equal("${field}", "${value}")`),
    },
}));

describe("invitations utility", () => {
    const mockAccount = {
        create: jest.fn(),
        createVerification: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});

        createAdminClient.mockReturnValue({
            account: mockAccount,
        });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("inviteUserByEmail", () => {
        const teamId = "team123";
        const email = "player@example.com";
        const name = "John Doe";
        const verificationUrl = "https://example.com/verify";

        it("should add existing user to team without creating new account", async () => {
            const existingUser = {
                $id: "existing-user-id",
                email: "player@example.com",
                firstName: "John",
                lastName: "Doe",
            };

            listDocuments.mockResolvedValue({
                rows: [existingUser],
            });

            addExistingUserToTeam.mockResolvedValue({
                $id: "membership-id",
            });

            const result = await inviteUserByEmail({
                email,
                teamId,
                name,
                verificationUrl,
            });

            // Should check if user exists
            expect(listDocuments).toHaveBeenCalledWith("users", [
                'Query.equal("email", "player@example.com")',
            ]);

            // Should add existing user to team
            expect(addExistingUserToTeam).toHaveBeenCalledWith({
                teamId,
                userId: existingUser.$id,
                roles: ["player"],
            });

            // Should NOT create new account
            expect(mockAccount.create).not.toHaveBeenCalled();
            expect(mockAccount.createVerification).not.toHaveBeenCalled();
            expect(createDocument).not.toHaveBeenCalled();

            expect(result).toEqual({
                success: true,
                userId: existingUser.$id,
                existingUser: true,
                message: `${email} has been added to the team`,
            });
        });

        it("should create new account and send verification email for new user", async () => {
            const newUser = {
                $id: "unique-user-id",
                email,
                name,
            };

            // No existing user found
            listDocuments.mockResolvedValue({ rows: [] });

            mockAccount.create.mockResolvedValue(newUser);
            mockAccount.createVerification.mockResolvedValue({
                $id: "verification-id",
            });

            createDocument.mockResolvedValue({
                $id: newUser.$id,
            });

            addExistingUserToTeam.mockResolvedValue({
                $id: "membership-id",
            });

            const result = await inviteUserByEmail({
                email,
                teamId,
                name,
                verificationUrl,
            });

            // Should check if user exists first
            expect(listDocuments).toHaveBeenCalledWith("users", [
                'Query.equal("email", "player@example.com")',
            ]);

            // Should create new Appwrite account
            expect(mockAccount.create).toHaveBeenCalledWith(
                "unique-user-id",
                email,
                expect.any(String), // temporary password
                name,
            );

            // Should create user document
            expect(createDocument).toHaveBeenCalledWith("users", newUser.$id, {
                userId: newUser.$id,
                firstName: "John",
                lastName: "Doe",
                email,
            });

            // Should add user to team
            expect(addExistingUserToTeam).toHaveBeenCalledWith({
                teamId,
                userId: newUser.$id,
                roles: ["player"],
            });

            // Should send verification email
            expect(mockAccount.createVerification).toHaveBeenCalledWith(
                verificationUrl,
            );

            expect(result).toEqual({
                success: true,
                userId: newUser.$id,
                existingUser: false,
                message: `Invitation sent to ${email}. They'll receive an email to set their password.`,
            });
        });

        it("should use email prefix as name if no name provided", async () => {
            const newUser = {
                $id: "unique-user-id",
                email: "newplayer@example.com",
            };

            listDocuments.mockResolvedValue({ rows: [] });
            mockAccount.create.mockResolvedValue(newUser);
            mockAccount.createVerification.mockResolvedValue({});
            createDocument.mockResolvedValue({ $id: newUser.$id });
            addExistingUserToTeam.mockResolvedValue({});

            await inviteUserByEmail({
                email: "newplayer@example.com",
                teamId,
                name: undefined, // No name provided
                verificationUrl,
            });

            // Should use email prefix as name
            expect(mockAccount.create).toHaveBeenCalledWith(
                "unique-user-id",
                "newplayer@example.com",
                expect.any(String),
                "newplayer", // email prefix
            );

            // Should use email prefix for firstName
            expect(createDocument).toHaveBeenCalledWith("users", newUser.$id, {
                userId: newUser.$id,
                firstName: "newplayer",
                lastName: "",
                email: "newplayer@example.com",
            });
        });

        it("should handle error when user creation fails", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const error = new Error("Account creation failed");
            mockAccount.create.mockRejectedValue(error);

            await expect(
                inviteUserByEmail({
                    email,
                    teamId,
                    name,
                    verificationUrl,
                }),
            ).rejects.toThrow("Account creation failed");

            expect(console.error).toHaveBeenCalledWith(
                "Error inviting user by email:",
                error,
            );
        });

        it("should handle 409 conflict error gracefully", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const error = new Error("Conflict");
            error.code = 409;
            mockAccount.create.mockRejectedValue(error);

            await expect(
                inviteUserByEmail({
                    email,
                    teamId,
                    name,
                    verificationUrl,
                }),
            ).rejects.toThrow(
                `Unable to invite ${email}. Please try again or contact support.`,
            );
        });

        it("should split full name into first and last name", async () => {
            const newUser = {
                $id: "unique-user-id",
                email,
            };

            listDocuments.mockResolvedValue({ rows: [] });
            mockAccount.create.mockResolvedValue(newUser);
            mockAccount.createVerification.mockResolvedValue({});
            createDocument.mockResolvedValue({ $id: newUser.$id });
            addExistingUserToTeam.mockResolvedValue({});

            await inviteUserByEmail({
                email,
                teamId,
                name: "John Michael Doe",
                verificationUrl,
            });

            expect(createDocument).toHaveBeenCalledWith("users", newUser.$id, {
                userId: newUser.$id,
                firstName: "John",
                lastName: "Michael Doe", // Everything after first name
                email,
            });
        });
    });
});
