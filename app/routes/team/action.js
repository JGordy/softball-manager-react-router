import { ID } from '@/appwrite';
import { createDocument } from '@/utils/databases.js';

export async function createPlayer({ request, params }) {
    const { teamId } = params;

    const formData = await request.formData();
    const playerData = Object.fromEntries(formData.entries());

    try {
        const userId = ID.unique(); // Create this now so it's easier to use later

        const player = await createDocument(
            'users', // Your users collection ID
            userId, // Generates a unique user ID in the handler
            {
                ...playerData,
                preferredPositions: playerData.preferredPositions.split(","), // Split into an array of positions
                userId,
            },
        );

        // Create document in relationship table for the user and team id's.
        await createDocument('memberships', null, { userId, teamId, role: 'player' });

        return { response: player, status: 200 };
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
}