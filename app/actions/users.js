import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

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