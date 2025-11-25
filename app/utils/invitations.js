import { ID } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";
import { createDocument, listDocuments } from "@/utils/databases";
import { addExistingUserToTeam } from "@/utils/teams";
import { Query } from "node-appwrite";
import { hasBadWords } from "@/utils/badWordsApi";

/**
 * Invite a user by email to join a team
 *
 * Smart function that:
 * - If user exists: Adds them to the team directly
 * - If user doesn't exist: Creates account and sends verification email
 *
 * @param {string} email - User's email address
 * @param {string} teamId - Team to add user to
 * @param {string} name - Optional user name
 * @param {string} verificationUrl - URL for email verification
 */
export async function inviteUserByEmail({
    email,
    teamId,
    name,
    verificationUrl,
}) {
    try {
        // Validate name if provided
        if (name && (await hasBadWords(name))) {
            throw new Error(
                "Name contains inappropriate language. Please use a different name.",
            );
        }

        // 1. Check if user already exists in database by email
        const existingUsers = await listDocuments("users", [
            Query.equal("email", email),
        ]);

        if (existingUsers.rows && existingUsers.rows.length > 0) {
            // User exists! Just add them to the team
            const existingUser = existingUsers.rows[0];

            await addExistingUserToTeam({
                teamId,
                userId: existingUser.$id,
                roles: ["player"],
            });

            return {
                success: true,
                userId: existingUser.$id,
                existingUser: true,
                message: `${email} has been added to the team`,
            };
        }

        // 2. User doesn't exist - create new account
        const { account } = createAdminClient();

        // Generate a random temporary password
        // User will set their own password via the verification email
        const tempPassword =
            Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2);

        // Create Appwrite account (this triggers the verification email)
        const user = await account.create(
            ID.unique(),
            email,
            tempPassword,
            name || email.split("@")[0], // Use name or email prefix
        );

        // Create user document in database
        await createDocument("users", user.$id, {
            userId: user.$id,
            firstName: name?.split(" ")[0] || email.split("@")[0],
            lastName: name?.split(" ").slice(1).join(" ") || "",
            email,
        });

        // Add user to the team (silently, no additional email)
        await addExistingUserToTeam({
            teamId,
            userId: user.$id,
            roles: ["player"],
        });

        // Send verification email
        // This is the email the user will receive to set their password
        await account.createVerification(verificationUrl);

        return {
            success: true,
            userId: user.$id,
            existingUser: false,
            message: `Invitation sent to ${email}. They'll receive an email to set their password.`,
        };
    } catch (error) {
        console.error("Error inviting user by email:", error);

        // Handle specific error cases
        if (error.code === 409) {
            throw new Error(
                `Unable to invite ${email}. Please try again or contact support.`,
            );
        }

        throw error;
    }
}
