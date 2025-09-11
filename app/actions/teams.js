import { ID } from "@/appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

import { removeEmptyValues } from "./utils/formUtils";

export async function createTeam({ values, userId }) {
    const teamData = removeEmptyValues({ values });

    try {
        const teamId = ID.unique(); // Create this now so it's easier to use later

        const team = await createDocument("teams", teamId, teamData);

        // Create document in relationship table for the user and team id's. Assume the user creating the team is a manager
        await createDocument("memberships", null, { userId, teamId, role: "manager" });

        return { response: team, status: 201 };
    } catch (error) {
        console.error("Error creating team:", error);
        throw error;
    }
}

export async function updateTeam({ values, teamId }) {
    // Removes undefined or empty string values from data to update
    const dataToUpdate = removeEmptyValues({ values });

    try {
        const teamDetails = await updateDocument("teams", teamId, dataToUpdate);

        return { response: { teamDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating team:", error);
        throw error;
    }
}

export async function addPlayerToTeam({ userId, teamId }) {
    try {
        if (!userId || !teamId) {
            throw new Error("User Id and Team Id are required");
        }

        // Create document in relationship table for the user and team id's. Add user as a player
        await createDocument("memberships", null, { userId, teamId, role: "player" });

        return { response: team, status: 201 };
    } catch (error) {
        console.error("Error adding player to existing team:", error);
        throw error;
    }
}
