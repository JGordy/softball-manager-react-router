import { ID } from '@/appwrite';
import { createDocument } from '@/utils/databases.js';

export async function createPlayer({ values, teamId }) {
    try {
        const userId = ID.unique(); // Create this now so it's easier to use later

        const player = await createDocument(
            'users', // Your users collection ID
            userId, // Generates a unique user ID in the handler
            {
                ...values,
                preferredPositions: values.preferredPositions.split(","), // Split into an array of positions
                userId,
            },
        );

        // Create document in relationship table for the user and team id's.
        await createDocument('memberships', null, { userId, teamId, role: 'player' });

        return { response: { player }, status: 201 };
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
}

export async function createSeason({ values, teamId }) {
    try {
        const seasonId = ID.unique(); // Create this now so it's easier to use later

        const season = await createDocument(
            'seasons', // Your users collection ID
            seasonId, // Generates a unique user ID in the handler
            {
                ...values,
                gameDays: values.gameDays.split(","), // Split into an array of positions
                signUpFee: Number(values.signUpFee),
                teamId,
                teams: [teamId],
            },
        );

        return { response: { season }, status: 201 };
    } catch (error) {
        console.error("Error creating season:", error);
        throw error;
    }
}