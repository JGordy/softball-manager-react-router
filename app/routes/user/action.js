import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

export async function createTeam({ request, params }) {
    const { userId } = params;

    const formData = await request.formData();
    const teamData = Object.fromEntries(formData.entries());


    try {
        const teamId = ID.unique(); // Create this now so it's easier to use later

        const team = await createDocument(
            'teams', // Your teams collection ID
            teamId, // Generates a unique team ID in the handler
            { ...teamData, signUpFee: Number(teamData.signUpFee) },
        );

        // Create document in relationship table for the user and team id's. Assume the user creating the team is a manager
        await createDocument('memberships', null, { userId, teamId, role: 'manager' });

        return { response: team, status: 200 };
    } catch (error) {
        console.error("Error creating team:", error);
        throw error;
    }
}

export async function updateUser({ request, params }) {
    const { userId } = params;

    const formData = await request.formData();
    const userData = Object.fromEntries(formData.entries());

    if (userData.preferredPositions) {
        userData.preferredPositions = userData.preferredPositions.split(",")
    }

    if (userData.dislikedPositions) {
        userData.dislikedPositions = userData.dislikedPositions.split(",")
    }

    // Removes undefined or empty string values from data to update
    const dataToUpdate = {};
    for (const key in userData) {
        if (userData.hasOwnProperty(key) && userData[key] !== undefined && userData[key] !== "") {
            dataToUpdate[key] = userData[key];
        }
    }

    try {
        const updatedUser = await updateDocument('users', userId, dataToUpdate);

        return { response: updatedUser, status: 204 }
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}