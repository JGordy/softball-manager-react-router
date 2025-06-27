import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

import { account } from '@/utils/appwrite/sessionClient';

import { removeEmptyValues } from './utils/formUtils';

export async function createPlayer({ values, teamId, userId }) {
    try {
        const _userId = userId || ID.unique(); // Create this now so it's easier to use later

        const player = await createDocument(
            'users',
            _userId,
            {
                ...values,
                preferredPositions: values.preferredPositions.split(","), // Split into an array of positions
                dislikedPositions: values.dislikedPositions.split(","), // Split into an array of positions
                userId,
            },
        );

        // Create document in relationship table for the user and team id's.
        await createDocument('memberships', null, { userId, teamId, role: 'player' });

        return { response: { player }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
}

export async function registerUser({ values }) {
    // TODO: Register function
};

export async function loginUser({ values }) {
    // TODO: Login function
};

export async function updateUser({ values, userId }) {

    // Removes undefined or empty string values from data to update
    let dataToUpdate = removeEmptyValues({ values });

    if (dataToUpdate.preferredPositions) {
        dataToUpdate.preferredPositions = dataToUpdate.preferredPositions.split(",");
    }

    if (dataToUpdate.dislikedPositions) {
        dataToUpdate.dislikedPositions = dataToUpdate.dislikedPositions.split(",");
    }

    try {
        const updatedUser = await updateDocument('users', userId, dataToUpdate);

        return { response: updatedUser, status: 204 }
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}

// Client Action only - so that we can use the Appwrite "account" SDK
// It handles updates to the Appwrite Authentication service which require a user session.
export async function updateAccountInfo({ values }) {
    const { user: _user, ...newContactInfo } = values;
    const user = JSON.parse(_user);
    const { email, password, phoneNumber } = newContactInfo;
    const userId = user.$id;

    let emailUpdated = false;
    let phoneUpdated = false;

    try {
        if (email && email !== user.email) {
            await account.updateEmail(email, password);
            emailUpdated = true;
        }

        if (phoneNumber && phoneNumber !== user.phoneNumber) {
            await account.updatePhone(phoneNumber, password);
            phoneUpdated = true;
        }

        if (emailUpdated || phoneUpdated) {
            // Call the server action to update the email or phone number in the user profile
            const serverFormData = new FormData();
            serverFormData.append('_action', 'update-profile-info');
            serverFormData.append('userId', userId);
            serverFormData.append('phoneNumber', phoneNumber);
            serverFormData.append('email', email);
            // Use fetch to call the server-side `action` for this same route
            await fetch('/settings', { method: 'POST', body: serverFormData });
        }

        return { success: true, status: 204, message: "Account information updated successfully.", action: 'update-account-info' };
    } catch (error) {
        console.error("Error updating account info:", error);
        return { success: false, status: 500, message: error.message || "Failed to update account information.", action: 'update-account-info' };
    }
}

export async function updatePassword({ values }) {
    const { currentPassword, newPassword } = values;

    try {
        await account.updatePassword(newPassword, currentPassword);
        return { success: true, status: 204, message: "Password updated successfully.", action: 'update-password' };
    } catch (error) {
        console.error("Error updating password:", error);
        return { success: false, status: 500, message: error.message || "Failed to update password.", action: 'update-password' };
    }
}