import { ID } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";

/**
 * Create an Appwrite Team
 * The creator is automatically assigned as "owner"
 */
export async function createAppwriteTeam({
    teamId,
    name,
    roles = ["manager", "player"],
}) {
    const { teams } = createAdminClient();

    try {
        const team = await teams.create(teamId || ID.unique(), name, roles);
        return team;
    } catch (error) {
        console.error("Error creating Appwrite team:", error);
        throw error;
    }
}

/**
 * Add a member to a team
 *
 * @param {Object} params
 * @param {string} params.teamId - Team ID
 * @param {string[]} params.roles - Array of role names (e.g., ["player", "manager"])
 * @param {string} [params.email] - Email address (for invitation)
 * @param {string} [params.userId] - User ID (for silent add without email)
 * @param {string} [params.url] - Redirect URL after accepting invitation
 * @param {string} [params.name] - Member's name
 *
 * @description
 * Email behavior:
 * - If userId is provided: Member added silently, NO email sent
 * - If only email provided (no userId): Invitation email IS sent
 */
export async function addTeamMember({
    teamId,
    roles,
    email,
    userId,
    url,
    name,
}) {
    const { teams } = createAdminClient();

    try {
        const membership = await teams.createMembership(
            teamId,
            roles,
            email, // optional
            userId, // optional - if provided, NO email sent
            undefined, // phone
            url, // redirect URL after accepting invite
            name, // optional member name
        );
        return membership;
    } catch (error) {
        console.error("Error adding team member:", error);
        throw error;
    }
}

/**
 * Add an existing user to a team (no email sent)
 */
export async function addExistingUserToTeam({ teamId, userId, roles }) {
    return addTeamMember({
        teamId,
        userId,
        roles,
        email: undefined,
        url: undefined,
        name: undefined,
    });
}

/**
 * Invite a new member by email (sends invitation email)
 */
export async function inviteNewMemberByEmail({ teamId, email, roles, name }) {
    const appUrl = import.meta.env.VITE_APP_URL || "http://localhost:5173";

    return addTeamMember({
        teamId,
        email,
        roles,
        userId: undefined, // Omit userId to trigger email
        url: `${appUrl}/teams/accept-invite`,
        name,
    });
}

/**
 * Get all members of a team
 */
export async function getTeamMembers({ teamId, queries, search }) {
    const { teams } = createAdminClient();

    try {
        const memberships = await teams.listMemberships(
            teamId,
            queries,
            search,
        );
        return memberships;
    } catch (error) {
        console.error("Error getting team members:", error);
        throw error;
    }
}

/**
 * Update a member's roles in a team
 */
export async function updateMembershipRoles({ teamId, membershipId, roles }) {
    const { teams } = createAdminClient();

    try {
        const membership = await teams.updateMembership(
            teamId,
            membershipId,
            roles,
        );
        return membership;
    } catch (error) {
        console.error("Error updating membership roles:", error);
        throw error;
    }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember({ teamId, membershipId }) {
    const { teams } = createAdminClient();

    try {
        await teams.deleteMembership(teamId, membershipId);
        return { success: true };
    } catch (error) {
        console.error("Error removing team member:", error);
        throw error;
    }
}

/**
 * Get a specific team by ID
 */
export async function getAppwriteTeam({ teamId }) {
    const { teams } = createAdminClient();

    try {
        const team = await teams.get(teamId);
        return team;
    } catch (error) {
        console.error("Error getting Appwrite team:", error);
        throw error;
    }
}

/**
 * Update team name
 */
export async function updateAppwriteTeamName({ teamId, name }) {
    const { teams } = createAdminClient();

    try {
        const team = await teams.updateName(teamId, name);
        return team;
    } catch (error) {
        console.error("Error updating team name:", error);
        throw error;
    }
}

/**
 * Delete an Appwrite team
 */
export async function deleteAppwriteTeam({ teamId }) {
    const { teams } = createAdminClient();

    try {
        await teams.delete(teamId);
        return { success: true };
    } catch (error) {
        console.error("Error deleting Appwrite team:", error);
        throw error;
    }
}
