import { ID } from "node-appwrite";
import {
    createDocument,
    updateDocument,
    readDocument,
} from "@/utils/databases.js";

import { createSessionClient } from "@/utils/appwrite/server";

import { hasBadWords } from "@/utils/badWordsApi";
import { isUserProfileComplete } from "@/utils/users";

import { removeEmptyValues } from "./utils/formUtils";

export async function createPlayer({ values, teamId, userId }) {
    try {
        // Check first and last name for inappropriate language
        if (values.firstName && (await hasBadWords(values.firstName))) {
            return {
                success: false,
                status: 400,
                message:
                    "First name contains inappropriate language. Please use a different name.",
            };
        }

        if (values.lastName && (await hasBadWords(values.lastName))) {
            return {
                success: false,
                status: 400,
                message:
                    "Last name contains inappropriate language. Please use a different name.",
            };
        }

        const _userId = userId || ID.unique(); // Create this now so it's easier to use later

        const preferredPositions = values.preferredPositions
            ? values.preferredPositions.split(",")
            : [];
        const dislikedPositions = values.dislikedPositions
            ? values.dislikedPositions
                  .split(",")
                  .filter((pos) => !preferredPositions.includes(pos))
            : [];

        const player = await createDocument("users", _userId, {
            ...values,
            preferredPositions,
            dislikedPositions,
            userId: _userId,
        });

        return { response: { player }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
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

        // Remove overlaps if preferredPositions is also being updated or exists in state?
        // Actually, if both are present in the update, we can clean them.
        // If only disliked is being updated, we might need the existing preferred positions,
        // but for simplicity and common usage (where both are usually sent or one is enough),
        // we'll just clean against what's in this update.
        if (dataToUpdate.preferredPositions) {
            dataToUpdate.dislikedPositions =
                dataToUpdate.dislikedPositions.filter(
                    (pos) => !dataToUpdate.preferredPositions.includes(pos),
                );
        }
    }

    try {
        // Check first and last name for inappropriate language
        if (
            dataToUpdate.firstName &&
            (await hasBadWords(dataToUpdate.firstName))
        ) {
            return {
                success: false,
                status: 400,
                message:
                    "First name contains inappropriate language. Please use a different name.",
            };
        }

        if (
            dataToUpdate.lastName &&
            (await hasBadWords(dataToUpdate.lastName))
        ) {
            return {
                success: false,
                status: 400,
                message:
                    "Last name contains inappropriate language. Please use a different name.",
            };
        }

        // Fetch the existing user to determine prior profile completion state
        let wasComplete = false;
        try {
            const existingUser = await readDocument("users", userId);
            wasComplete = isUserProfileComplete(existingUser);
        } catch (fetchError) {
            // If we can't fetch the existing user, assume it was not complete
            console.warn(
                "Unable to fetch existing user before update:",
                fetchError,
            );
        }

        const updatedUser = await updateDocument("users", userId, dataToUpdate);

        // Check if the profile is now considered "complete"
        const isNowComplete = isUserProfileComplete(updatedUser);

        const event =
            !wasComplete && isNowComplete
                ? { name: "player-profile-completed", data: { userId } }
                : { name: "player-profile-updated", data: { userId } };

        return {
            response: updatedUser,
            status: 204,
            success: true,
            message: "User updated successfully.",
            event,
        };
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
            }

            await account.updatePhone(formattedPhone, password);
            phoneUpdated = true;
        }

        if (emailUpdated || phoneUpdated) {
            // Update the email or phone number in the user profile
            try {
                await updateUser({ userId, values: { phoneNumber, email } });
            } catch (dbError) {
                console.error(
                    "Data inconsistency: Appwrite account updated, but failed to update user document in database.",
                    dbError,
                );
                return {
                    success: false,
                    status: 500,
                    message:
                        "Appwrite account updated, but failed to update user document in database. Please contact support.",
                    action: "update-account-info",
                };
            }
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
