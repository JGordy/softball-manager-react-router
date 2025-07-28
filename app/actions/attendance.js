import { ID, Query } from '@/appwrite';
import { createDocument, listDocuments, updateDocument } from '@/utils/databases';

export async function updatePlayerAttendance({ values, eventId }) {
    const { playerId, ...updates } = values;

    try {
        const response = await listDocuments('attendance', [
            Query.equal('gameId', eventId),
        ]);

        if (response.documents.length === 0) {
            const result = await createDocument('attendance', ID.unique(), {
                gameId: eventId,
                playerId,
                ...updates,
            });

            return { response: result, status: 201, success: true };
        }

        if (response.documents.length > 0) {
            const currentPlayerAttendance = response.documents.find(doc => doc.playerId === playerId);

            // If the current player's attendance is not found, create a new document
            if (!currentPlayerAttendance) {
                const result = await createDocument('attendance', ID.unique(), {
                    gameId: eventId,
                    playerId,
                    ...updates,
                });

                return { response: result, status: 201, success: true };
            }

            // If the current player's attendance is found, update it
            const updatedResponse = await updateDocument('attendance', currentPlayerAttendance.$id, { ...updates });

            return { response: updatedResponse, status: 204, success: true };
        }

    } catch (error) {
        console.error('Error updating player attendance:', error);
        return { success: false, error: error.message, status: 500 };
    }
}

