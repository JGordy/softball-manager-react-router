import { ID, Permission, Role } from "node-appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";
import {
    createAppwriteTeam,
    addExistingUserToTeam,
    inviteNewMemberByEmail,
    getTeamMembers,
    updateMembershipRoles,
} from "@/utils/teams.js";

import { hasBadWords } from "@/utils/badWordsApi";

import { removeEmptyValues } from "./utils/formUtils";

export async function createTeam({ values, userId }) {
    const teamData = removeEmptyValues({ values });

    try {
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
        const team = await createDocument("teams", teamId, teamData, [
            Permission.read(Role.team(teamId)), // All team members can read
            Permission.update(Role.team(teamId, "manager")), // Only managers can update
            Permission.delete(Role.team(teamId, "manager")), // Only managers can delete
        ]);

        // Note: No need for separate memberships table - Appwrite Teams API handles it automatically

        return { response: team, status: 201, success: true };
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
            };
        }
    } catch (error) {
        console.error("Error adding player to existing team:", error);
        throw error;
    }
}

export async function updateMemberRole({ values, teamId }) {
    const { playerId: userId, role } = values;
    try {
        // 1. Get membership ID
        const memberships = await getTeamMembers({ teamId });
        const membership = memberships.memberships.find(
            (m) => m.userId === userId,
        );

        if (!membership) {
            throw new Error("Membership not found");
        }

        // 2. Determine new roles
        let newRoles = [];
        if (role === "owner") {
            newRoles = ["owner", "manager", "player"];
        } else if (role === "manager") {
            newRoles = ["manager", "player"];
        } else {
            newRoles = ["player"];
        }

        // 3. Update roles
        await updateMembershipRoles({
            teamId,
            membershipId: membership.$id,
            roles: newRoles,
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating member role:", error);
        return { success: false, error: error.message };
    }
}
