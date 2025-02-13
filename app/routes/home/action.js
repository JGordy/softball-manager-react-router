import { ID } from '@/appwrite';
import { createDocument } from '@/utils/databases.js';

export async function createTeam({ request, params }) {
    const { userId } = params;

    const formData = await request.formData();
    const teamData = Object.fromEntries(formData.entries());



    try {
        const teamId = ID.unique(); // Create this now so it's easier to use later

        const team = await createDocument(
            'teams', // Your teams collection ID
            teamId, // Generates a unique team ID in the handler
            teamData,
        );

        // Create document in relationship table for the user and team id's. Assume the user creating the team is a coach
        const membership = await createDocument('memberships', null, { userId, teamId, role: 'coach' });

        return { response: team, status: 200 };
    } catch (error) {
        console.error("Error creating team:", error);
        throw error;
    }
}