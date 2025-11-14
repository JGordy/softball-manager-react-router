import { ID } from "@/appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

import { createSessionClient } from "@/utils/appwrite/server";

import { removeEmptyValues } from "./utils/formUtils";

export async function createPlayer({ values, teamId, userId }) {
    try {
        const _userId = userId || ID.unique(); // Create this now so it's easier to use later

        const player = await createDocument("users", _userId, {
            ...values,
            preferredPositions: values.preferredPositions.split(","), // Split into an array of positions
            dislikedPositions: values.dislikedPositions.split(","), // Split into an array of positions
            userId: _userId,
        });

        // Create document in relationship table for the user and team id's.
        await createDocument("memberships", null, {
            userId: _userId,
            teamId,
            role: "player",
        });

        return { response: { player }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
}

export async function registerUser({ values }) {
    // TODO: Register function
}

export async function loginUser({ values }) {
    // TODO: Login function
}

export async function updateUser({ values, userId }) {
    // Removes undefined or empty string values from data to update
    let dataToUpdate = removeEmptyValues({ values });

    if (dataToUpdate.preferredPositions) {
        dataToUpdate.preferredPositions =
            dataToUpdate.preferredPositions.split(",");
    }

    if (dataToUpdate.dislikedPositions) {
        dataToUpdate.dislikedPositions =
            dataToUpdate.dislikedPositions.split(",");
    }

    try {
        const updatedUser = await updateDocument("users", userId, dataToUpdate);

        return { response: updatedUser, status: 204 };
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}

// Server action - uses server-side session for authentication
export async function updateAccountInfo({ values, request }) {
    const { user: _user, ...newContactInfo } = values;
    const user = JSON.parse(_user);
    const { email, password, phoneNumber } = newContactInfo;
    const userId = user.$id;

    let emailUpdated = false;
    let phoneUpdated = false;

    try {
        // Get authenticated account from server session
        const { account } = await createSessionClient(request);

        if (email && email !== user.email) {
            await account.updateEmail(email, password);
            emailUpdated = true;
        }

        if (phoneNumber && phoneNumber !== user.phoneNumber) {
            // Format phone number to E.164 format (required by Appwrite)
            // If it doesn't start with +, assume US number and add +1
            let formattedPhone = phoneNumber.replace(/\D/g, ""); // Remove non-digits
            if (!phoneNumber.startsWith("+")) {
                formattedPhone = "+1" + formattedPhone;
            } else {
                formattedPhone = "+" + formattedPhone;
            }

            await account.updatePhone(formattedPhone, password);
            phoneUpdated = true;
        }

        if (emailUpdated || phoneUpdated) {
            // Update the email or phone number in the user profile
            await updateUser({ userId, values: { phoneNumber, email } });
        }

        return {
            success: true,
            status: 204,
            message: "Account information updated successfully.",
            action: "update-account-info",
        };
    } catch (error) {
        console.error("Error updating account info:", error);
        return {
            success: false,
            status: 500,
            message: error.message || "Failed to update account information.",
            action: "update-account-info",
        };
    }
}

export async function updatePassword({ values, request }) {
    const { currentPassword, newPassword } = values;

    try {
        // Get authenticated account from server session
        const { account } = await createSessionClient(request);

        await account.updatePassword(newPassword, currentPassword);
        return {
            success: true,
            status: 204,
            message: "Password updated successfully.",
            action: "update-password",
        };
    } catch (error) {
        console.error("Error updating password:", error);
        return {
            success: false,
            status: 500,
            message: error.message || "Failed to update password.",
            action: "update-password",
        };
    }
}

export async function resetPassword({ values, request }) {
    const { email } = values;
    const url = new URL(request.url);
    // The URL the user will be redirected to from the email.
    const resetUrl = `${url.origin}/recovery`;

    try {
        // Get authenticated account from server session
        const { account } = await createSessionClient(request);

        await account.createRecovery(email, resetUrl);
        return {
            success: true,
            status: 200,
            message:
                "Password reset email sent successfully. Please check your inbox.",
            action: "password-reset",
        };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        return {
            success: false,
            status: 500,
            message: error.message || "Failed to send password reset email.",
            action: "password-reset",
        };
    }
}
