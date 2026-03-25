import { ID, Permission, Query, Role } from "node-appwrite";
import {
    createDocument,
    listDocuments,
    updateDocument,
    readDocument,
} from "@/utils/databases";
import { createAdminClient } from "@/utils/appwrite/server";

/**
 * Updates or creates a player's attendance record for a specific game.
 *
 * SECURITY EXCEPTION:
 * Most loaders and actions in this application use the user's session `client` for Appwrite DB operations.
 * However, this action requires a server-side `adminClient` to bypass Appwrite's Document Security constraint
 * ("a user can only grant permission roles they possess").
 *
 * Because managers need to create attendance records on behalf of players and grant them
 * `Permission.update(Role.user(playerId))`, using the session client would fail throwing a
 * 401 "Permissions must be one of..." error. We must manually authorize the session user,
 * then use the Admin Client to securely create/update the document.
 */
export async function updatePlayerAttendance({
    values,
    eventId,
    client,
    bypassAuth = false,
}) {
    const { playerId, updatedBy, teamId, ...updates } = values;

    try {
        if (!client)
            throw new Error(
                "A constructed 'client' object is strictly required for authorization.",
            );

        // --- AUTHORIZATION CHECK ---
        let isAuthorized = false;

        // Note: Using adminClient here to bypass Appwrite "grant only what you possess" restriction on createDocument
        const adminClient = createAdminClient();

        if (bypassAuth) {
            isAuthorized = true;
        } else {
            const { account } = client;
            const currentUser = await account.get();
            if (!currentUser) throw new Error("Unauthorized");

            isAuthorized = currentUser.$id === playerId;

            if (teamId) {
                const gameDoc = await readDocument(
                    "games",
                    eventId,
                    [],
                    adminClient,
                );
                if (!gameDoc || gameDoc.teamId !== teamId) {
                    return {
                        success: false,
                        error: "Invalid team association for this event.",
                        status: 400,
                    };
                }
            }

            if (!isAuthorized && teamId) {
                const membershipsResponse =
                    await adminClient.teams.listMemberships(teamId);
                const membership = membershipsResponse.memberships.find(
                    (m) => m.userId === currentUser.$id,
                );
                if (
                    membership &&
                    (membership.roles.includes("manager") ||
                        membership.roles.includes("owner") ||
                        membership.roles.includes("scorekeeper"))
                ) {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return {
                success: false,
                error: "Unauthorized to update attendance for this player.",
                status: 403,
            };
        }
        // --- END AUTHORIZATION CHECK ---

        // --- PERMISSIONS CONFIGURATION ---
        // [IMPORTANT] Appwrite Security Rule: A user session can ONLY grant permissions/roles
        // that the current user already possesses.
        // Example: A user with only 'scorekeeper' role cannot grant 'manager' role to a doc.
        //
        // To bypass this "grant what you possess" restriction, we use the adminClient (API Key)
        // for the actual database writes below. This allows managers/scorekeepers to
        // initialize or update attendance records for OTHER players.
        const permissions = teamId
            ? [
                  Permission.read(Role.team(teamId)), // All team members can read
                  Permission.update(Role.user(playerId)), // Player can update their own
                  Permission.update(Role.team(teamId, "scorekeeper")), // Scorekeepers can update
                  Permission.update(Role.team(teamId, "manager")), // Managers can update
                  Permission.update(Role.team(teamId, "owner")), // Owners can update
                  Permission.delete(Role.user(playerId)), // Player can delete their own
                  Permission.delete(Role.team(teamId, "manager")), // Managers can delete
                  Permission.delete(Role.team(teamId, "owner")), // Owners can delete
              ]
            : [];

        // Use adminClient for all DB operations to bypass the strict "you can only grant what you possess" rule during creation
        const response = await listDocuments(
            "attendance",
            [Query.equal("gameId", eventId)],
            adminClient,
        );

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
                adminClient,
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
                    adminClient,
                );

                return { response: result, status: 201, success: true };
            }

            // If the current player's attendance is found, update it
            const updatedResponse = await updateDocument(
                "attendance",
                currentPlayerAttendance.$id,
                { ...updates },
                adminClient,
            );

            return { response: updatedResponse, status: 204, success: true };
        }
    } catch (error) {
        console.error("Error updating player attendance:", error);
        return { success: false, error: error.message, status: 500 };
    }
}
