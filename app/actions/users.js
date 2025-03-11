import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

import { removeEmptyValues } from './utils/formUtils';

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