import { ID, Permission, Role } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";
import { createDocument, updateDocument } from "@/utils/databases.js";
import {
    createAppwriteTeam,
    addExistingUserToTeam,
    inviteNewMemberByEmail,
    getTeamMembers,
    updateMembershipRoles,
    updateTeamPreferences,
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
            roles: ["owner", "manager"],
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

        Object.entries(values).forEach(([key, value]) => {
            if (key.startsWith("jerseyNumber[")) {
                const match = key.match(/\[(.*?)\]/);
                const userId = match?.[1];

                if (!userId) {
                    return;
                }

                const normalizedValue = String(value ?? "").trim();

                // If empty string is submitted, remove the jersey number
                if (normalizedValue === "") {
                    delete newJerseyNumbers[userId];
                    return;
                }

                // If it's a valid digit string, update the jersey number
                if (/^\d+$/.test(normalizedValue)) {
                    newJerseyNumbers[userId] = normalizedValue;
                }
            }
        });

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
