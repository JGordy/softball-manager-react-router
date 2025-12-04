import { ID, Permission, Query, Role } from "node-appwrite";
import {
    createDocument,
    listDocuments,
    updateDocument,
} from "@/utils/databases";

export async function updatePlayerAttendance({ values, eventId }) {
    const { playerId, updatedBy, teamId, ...updates } = values;

    try {
        // Build permissions array if we have teamId
        const permissions = teamId
            ? [
                  Permission.read(Role.team(teamId)), // All team members can read
                  Permission.update(Role.user(playerId)), // Player can update their own
                  Permission.update(Role.team(teamId, "manager")), // Team managers can update
                  Permission.update(Role.team(teamId, "owner")), // Team owners can update
                  Permission.delete(Role.user(playerId)), // Player can delete their own
                  Permission.delete(Role.team(teamId, "manager")), // Team managers can delete
                  Permission.delete(Role.team(teamId, "owner")), // Team owners can delete
              ]
            : [];

        const response = await listDocuments("attendance", [
            Query.equal("gameId", eventId),
        ]);

        if (response.rows.length === 0) {
            const result = await createDocument(
                "attendance",
                ID.unique(),
                {
                    gameId: eventId,
                    playerId,
                    updatedBy,
                    ...updates,
                },
                permissions,
            );

            return { response: result, status: 201, success: true };
        }

        if (response.rows.length > 0) {
            const currentPlayerAttendance = response.rows.find(
                (doc) => doc.playerId === playerId,
            );

            // If the current player's attendance is not found, create a new document
            if (!currentPlayerAttendance) {
                const result = await createDocument(
                    "attendance",
                    ID.unique(),
                    {
                        gameId: eventId,
                        playerId,
                        updatedBy,
                        ...updates,
                    },
                    permissions,
                );

                return { response: result, status: 201, success: true };
            }

            // If the current player's attendance is found, update it
            const updatedResponse = await updateDocument(
                "attendance",
                currentPlayerAttendance.$id,
                { ...updates },
            );

            return { response: updatedResponse, status: 204, success: true };
        }
    } catch (error) {
        console.error("Error updating player attendance:", error);
        return { success: false, error: error.message, status: 500 };
    }
}
