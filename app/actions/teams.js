import { ID, Permission, Role, Query } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";
import {
    createDocument,
    updateDocument,
    deleteDocument,
    listDocuments,
} from "@/utils/databases.js";
import {
    createAppwriteTeam,
    addExistingUserToTeam,
    inviteNewMemberByEmail,
    getTeamMembers,
    updateMembershipRoles,
    updateTeamPreferences,
    deleteAppwriteTeam,
    removeTeamMember,
} from "@/utils/teams.js";

import { hasBadWords } from "@/utils/badWordsApi";

import { removeEmptyValues } from "./utils/formUtils";
import { verifyManager } from "./utils/teamAuth.js";

export async function createTeam({ values, userId, client }) {
    const teamData = removeEmptyValues({ values });

    try {
        if (!client)
            throw new Error(
                "A constructed 'client' object is strictly required for authorization.",
            );
        // Check team name for inappropriate language
        if (teamData.name && (await hasBadWords(teamData.name))) {
            return {
                success: false,
                status: 400,
                message:
                    "Team name contains inappropriate language. Please choose a different name.",
            };
        }

        const teamId = ID.unique();

        // 1. Create Appwrite Team (handles memberships & permissions)
        await createAppwriteTeam({
            teamId,
            name: teamData.name,
            roles: ["manager", "player", "coach"], // Define your team roles
        });

        // 2. Add creator as first member with owner & manager roles
        // Note: Using userId means NO email is sent (silent add)
        await addExistingUserToTeam({
            teamId,
            userId,
            roles: ["owner", "manager", "scorekeeper", "player"], // Owner has all roles
        });

        // 3. Create database record for custom team data with permissions
        const team = await createDocument(
            "teams",
            teamId,
            teamData,
            [
                Permission.read(Role.team(teamId)), // All team members can read
                Permission.update(Role.team(teamId, "manager")), // Only managers can update
                Permission.delete(Role.team(teamId, "manager")), // Only managers can delete
            ],
            client,
        );

        return {
            response: team,
            status: 201,
            success: true,
            event: {
                name: "team-created",
                data: {
                    teamId,
                },
            },
        };
    } catch (error) {
        console.error("Error creating team:", error);
        throw error;
    }
}

export async function updateTeam({ values, teamId, client }) {
    // Removes undefined or empty string values from data to update
    const dataToUpdate = removeEmptyValues({ values });

    try {
        if (!client)
            throw new Error(
                "A constructed 'client' object is strictly required for authorization.",
            );
        const teamDetails = await updateDocument(
            "teams",
            teamId,
            dataToUpdate,
            client,
        );

        return { response: { teamDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating team:", error);
        throw error;
    }
}

export async function addPlayerToTeam({ userId, email, teamId, name }) {
    try {
        if ((!userId && !email) || !teamId) {
            throw new Error(
                "Either userId or email must be provided, along with teamId",
            );
        }

        // Decide: Silent add vs Email invitation
        if (userId) {
            // User exists in system - add them silently (no email)
            await addExistingUserToTeam({
                teamId,
                userId,
                roles: ["player"],
            });

            return {
                response: { teamId, userId },
                status: 201,
                success: true,
                message: "Player added to team successfully",
                event: {
                    name: "player-added-to-team",
                    data: {
                        teamId,
                    },
                },
            };
        } else {
            // Invite by email - sends invitation email
            await inviteNewMemberByEmail({
                teamId,
                email,
                roles: ["player"],
                name,
            });

            return {
                response: { teamId, email },
                status: 201,
                success: true,
                message: "Invitation email sent to player",
                event: {
                    name: "player-invited-to-team",
                    data: {
                        teamId,
                    },
                },
            };
        }
    } catch (error) {
        console.error("Error adding player to existing team:", error);
        throw error;
    }
}

export async function updateMemberRole({ values, teamId, client }) {
    const { playerId: userId, role } = values;

    // Validate role input
    const validRoles = ["owner", "manager", "scorekeeper", "player"];
    if (!validRoles.includes(role)) {
        return {
            success: false,
            message: `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`,
        };
    }

    try {
        // 1. Get requesting user from session
        if (!client)
            throw new Error(
                "A constructed 'client' object is strictly required for authorization.",
            );
        const { account } = client;
        const requestingUser = await account.get();

        // 2. Get team memberships
        const memberships = await getTeamMembers({ teamId });

        // 3. Verify requesting user is an owner
        const requestingMembership = memberships.memberships.find(
            (m) => m.userId === requestingUser.$id,
        );

        if (!requestingMembership?.roles.includes("owner")) {
            return {
                success: false,
                message: "Only team owners can change member roles",
            };
        }

        // Prevent owner from demoting themselves if they're the last owner
        if (requestingUser.$id === userId && role !== "owner") {
            const otherOwners = memberships.memberships.filter(
                (m) => m.userId !== userId && m.roles.includes("owner"),
            );

            if (otherOwners.length === 0) {
                return {
                    success: false,
                    message:
                        "Cannot remove the last owner. Assign another owner first.",
                };
            }
        }

        // 4. Get target membership
        const membership = memberships.memberships.find(
            (m) => m.userId === userId,
        );

        if (!membership) {
            return {
                success: false,
                message: "Membership not found",
            };
        }

        // 5. Determine new roles
        let newRoles = [];
        if (role === "owner") {
            newRoles = ["owner", "manager", "scorekeeper", "player"];
        } else if (role === "manager") {
            newRoles = ["manager", "scorekeeper", "player"];
        } else if (role === "scorekeeper") {
            newRoles = ["scorekeeper", "player"];
        } else {
            newRoles = ["player"];
        }

        // 6. Update roles
        await updateMembershipRoles({
            teamId,
            membershipId: membership.$id,
            roles: newRoles,
        });

        return {
            success: true,
            message: "Member role updated successfully",
        };
    } catch (error) {
        console.error("Error updating member role:", error);
        return {
            success: false,
            message: error.message || "Failed to update member role",
        };
    }
}

export async function updatePreferences({ teamId, prefs }) {
    return await updateTeamPreferences(teamId, prefs);
}

export async function updateJerseyNumber({
    teamId,
    playerId,
    jerseyNumber,
    client,
}) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const auth = await verifyManager(teamId, client);
        if (!auth.success) return auth;

        const { teams: teamsApi } = createAdminClient();

        // 1. Get current preferences
        const currentPrefs = await teamsApi.getPrefs(teamId);

        // 2. Normalize and validate the jersey number
        const normalizedValue = String(jerseyNumber ?? "").trim();
        const jerseyNumbers = { ...(currentPrefs.jerseyNumbers || {}) };

        // If empty string is submitted, remove the jersey number
        if (normalizedValue === "") {
            delete jerseyNumbers[playerId];
        } else if (/^\d+$/.test(normalizedValue)) {
            // If it's a valid digit string, update the jersey number
            jerseyNumbers[playerId] = normalizedValue;
        } else {
            return {
                success: false,
                message: "Jersey number must contain digits only",
            };
        }

        // 3. Save back to Appwrite
        await teamsApi.updatePrefs(teamId, {
            ...currentPrefs,
            jerseyNumbers,
        });

        return {
            success: true,
            message: "Jersey number updated successfully",
        };
    } catch (error) {
        console.error("Error updating jersey number:", error);
        return {
            success: false,
            message: error.message || "Failed to update jersey number",
        };
    }
}

export async function updateBulkJerseyNumbers({ teamId, values, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const auth = await verifyManager(teamId, client);
        if (!auth.success) return auth;

        const { teams: teamsApi } = createAdminClient();

        // 3. Get current preferences
        const currentPrefs = await teamsApi.getPrefs(teamId);

        // 4. Extract jersey numbers from values
        const newJerseyNumbers = { ...(currentPrefs.jerseyNumbers || {}) };
        const errors = [];

        Object.entries(values).forEach(([key, value]) => {
            if (key.startsWith("jerseyNumber[")) {
                const match = key.match(/\[(.*?)\]/);
                const playerId = match?.[1];

                if (!playerId) {
                    return;
                }

                const normalizedValue = String(value ?? "").trim();

                // If empty string is submitted, remove the jersey number
                if (normalizedValue === "") {
                    delete newJerseyNumbers[playerId];
                } else if (/^\d+$/.test(normalizedValue)) {
                    // If it's a valid digit string, update the jersey number
                    newJerseyNumbers[playerId] = normalizedValue;
                } else {
                    // Invalid entry found
                    errors.push(playerId);
                }
            }
        });

        if (errors.length > 0) {
            return {
                success: false,
                message:
                    "Some jersey numbers were invalid (digits only are allowed). No changes were saved.",
            };
        }

        // 5. Save back to Appwrite
        await teamsApi.updatePrefs(teamId, {
            ...currentPrefs,
            jerseyNumbers: newJerseyNumbers,
        });

        return {
            success: true,
            message: "Jersey numbers updated successfully",
        };
    } catch (error) {
        console.error("Error updating bulk jersey numbers:", error);
        return {
            success: false,
            message: "Failed to update jersey numbers",
        };
    }
}

/**
 * Batch remove players from a team
 * @param {Object} params
 * @param {string} params.teamId
 * @param {string[]} params.membershipIds
 * @param {Object} params.client
 */
export async function removePlayersFromTeam({ teamId, membershipIds, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const auth = await verifyManager(teamId, client);
        if (!auth.success) return auth;

        const memberships = await getTeamMembers({ teamId });
        const targetMemberships = memberships.memberships.filter((m) =>
            membershipIds.includes(m.$id),
        );

        // Safety check: Don't allow removing the last owner
        const owners = memberships.memberships.filter((m) =>
            m.roles.includes("owner"),
        );
        const ownersBeingRemoved = targetMemberships.filter((m) =>
            m.roles.includes("owner"),
        );

        if (
            ownersBeingRemoved.length > 0 &&
            owners.length <= ownersBeingRemoved.length
        ) {
            return {
                success: false,
                message:
                    "Cannot remove the last owner(s). Assign another owner first.",
            };
        }

        // Perform removals — use allSettled so a single failure doesn't abort the rest
        const removePromises = targetMemberships.map((m) =>
            removeTeamMember({ teamId, membershipId: m.$id }),
        );

        const results = await Promise.allSettled(removePromises);
        const succeeded = results.filter(
            (r) => r.status === "fulfilled",
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed > 0 && succeeded === 0) {
            return {
                success: false,
                message: `Failed to remove ${failed} player(s)`,
            };
        }

        return {
            success: true,
            message:
                failed > 0
                    ? `${succeeded} player(s) removed successfully, ${failed} failed`
                    : `${succeeded} player(s) removed successfully`,
        };
    } catch (error) {
        console.error("Error removing players from team:", error);
        return {
            success: false,
            message: error.message || "Failed to remove players",
        };
    }
}

export async function updatePlayerLabels({ teamId, values, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const auth = await verifyManager(teamId, client);
        if (!auth.success) return auth;

        const { teams: teamsApi } = createAdminClient();

        // 1. Get current preferences
        const currentPrefs = await teamsApi.getPrefs(teamId);

        // 2. Extract labels from values
        // Expecting values.labels to be an object like: { "player1": ["Power"], "player2": ["Power", "On Base"] }
        const newPlayerLabels = { ...(currentPrefs.playerLabels || {}) };

        if (values.labels) {
            Object.entries(values.labels).forEach(([playerId, labelsArray]) => {
                if (!labelsArray || labelsArray.length === 0) {
                    delete newPlayerLabels[playerId];
                } else {
                    newPlayerLabels[playerId] = Array.isArray(labelsArray)
                        ? labelsArray
                        : [labelsArray];
                }
            });
        }

        // 3. Save back to Appwrite
        await teamsApi.updatePrefs(teamId, {
            ...currentPrefs,
            playerLabels: newPlayerLabels,
        });

        return {
            success: true,
            message: "Player labels updated successfully",
        };
    } catch (error) {
        console.error("Error updating player labels:", error);
        return {
            success: false,
            message: "Failed to update player labels",
        };
    }
}

/**
 * Checks whether a team has any meaningful associated data that would make
 * a hard delete unsafe. Returns true if seasons or game_logs exist for the team.
 *
 * @param {Object} params
 * @param {string} params.teamId - The team ID to check
 * @param {Object} params.client - The session client
 * @returns {Promise<boolean>} True if associated data exists
 */
async function hasAssociatedData({ teamId, client }) {
    const [seasonsResult, gamesResult] = await Promise.all([
        listDocuments(
            "seasons",
            [Query.equal("teamId", teamId), Query.limit(1)],
            client,
        ),
        listDocuments(
            "games",
            [Query.equal("teamId", teamId), Query.limit(1)],
            client,
        ),
    ]);

    return (seasonsResult?.total ?? 0) > 0 || (gamesResult?.total ?? 0) > 0;
}

/**
 * Soft-deletes a team by setting `archived: true` on the database document.
 * The Appwrite Team record and all memberships are preserved so permissions
 * remain intact, but the team will be filtered from all application views.
 *
 * Only team owners may archive a team.
 *
 * @param {Object} params
 * @param {string} params.teamId - The team ID to archive
 * @param {Object} params.client - The session client
 * @returns {Promise<Object>} Result object with success flag and message
 */
export async function archiveTeam({ teamId, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const auth = await verifyManager(teamId, client);
        if (!auth.success) return auth;

        // Verify the requesting user is an owner, not just a manager
        const { account } = client;
        const requestingUser = await account.get();
        const memberships = await getTeamMembers({ teamId });
        const requestingMembership = memberships.memberships.find(
            (m) => m.userId === requestingUser.$id,
        );

        if (!requestingMembership?.roles.includes("owner")) {
            return {
                success: false,
                message: "Only team owners can archive a team.",
            };
        }

        await updateDocument("teams", teamId, { archived: true }, client);

        return {
            success: true,
            archived: true,
            message:
                "Team archived. It will no longer appear in your dashboard. Contact support if you need to restore it.",
        };
    } catch (error) {
        console.error("Error archiving team:", error);
        return {
            success: false,
            message: error.message || "Failed to archive team.",
        };
    }
}

/**
 * Smartly removes a team:
 * - If the team has no seasons and no game_logs, and has only one member
 *   (the creator), it performs a hard delete: removes the DB document,
 *   the Appwrite Team record, and the notification topic.
 * - Otherwise, it falls back to a soft archive to preserve historical data.
 *
 * Only team owners may call this action.
 *
 * @param {Object} params
 * @param {string} params.teamId - The team ID to remove
 * @param {Object} params.client - The session client
 * @returns {Promise<Object>} Result with success flag, archived boolean, and message
 */
export async function deleteTeamCompletely({ teamId, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const auth = await verifyManager(teamId, client);
        if (!auth.success) return auth;

        // Verify the requesting user is an owner
        const { account } = client;
        const requestingUser = await account.get();
        const memberships = await getTeamMembers({ teamId });
        const requestingMembership = memberships.memberships.find(
            (m) => m.userId === requestingUser.$id,
        );

        if (!requestingMembership?.roles.includes("owner")) {
            return {
                success: false,
                message: "Only team owners can remove a team.",
            };
        }

        // Determine whether a hard delete is safe
        const isSolo = memberships.total === 1;
        const dataExists = await hasAssociatedData({ teamId, client });

        if (dataExists || !isSolo) {
            // Fall back to soft archive to preserve historical data
            await updateDocument("teams", teamId, { archived: true }, client);

            return {
                success: true,
                archived: true,
                message:
                    "This team has existing data and has been archived. It will no longer appear in your dashboard. Contact support if you need to restore it.",
            };
        }

        // Safe to hard delete — remove DB document first, then Appwrite Team
        await deleteDocument("teams", teamId, client);
        await deleteAppwriteTeam({ teamId });

        // Non-blocking: clean up the notification topic created alongside the team
        try {
            const { messaging } = createAdminClient();
            const { buildTeamTopic } = await import("@/utils/notifications");
            await messaging.deleteTopic(buildTeamTopic(teamId));
        } catch (topicError) {
            console.warn(
                `[deleteTeamCompletely] Failed to delete notification topic for team ${teamId}:`,
                topicError,
            );
        }

        return {
            success: true,
            archived: false,
            message: "Team permanently removed.",
        };
    } catch (error) {
        console.error("Error deleting team:", error);
        return {
            success: false,
            message: error.message || "Failed to remove team.",
        };
    }
}
