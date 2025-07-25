import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

export async function getUserById({ userId }) {
    return await readDocument('users', userId);
};

export async function getTeamsByUserId({ userId }) {
    // 1. Check relationships table to list memberships for the userId, manager
    const memberships = await listDocuments('memberships', [
        Query.equal('userId', userId),
        Query.equal('role', ['manager', 'player']),
    ]);

    // 2. Extract teamIds
    const teamIds = memberships.documents.map(m => m.teamId);

    // 3. Call the Appwrite function
    let teams = [];
    if (teamIds.length > 0) {
        // Make multiple queries
        const promises = teamIds.map(async (teamId) => {
            const result = await listDocuments('teams', [
                Query.equal('$id', teamId),
            ]);
            return result.documents; // Extract the documents
        });

        const results = await Promise.all(promises); // Wait for all queries to complete
        teams = results.flat(); // Flatten the array of arrays into a single array
    }

    return teams;
}

export async function getAttendanceByUserId({ userId }) {
    const attendance = await listDocuments('attendance', [
        Query.equal('users', userId),
    ]);

    return attendance.documents.length > 0 ? attendance.documents : [];
}