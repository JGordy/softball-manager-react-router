import { getTeamMembers } from "@/utils/teams.js";

/**
 * Verifies that the requesting user has manager or owner roles for a team.
 *
 * @param {string} teamId - Team ID to check
 * @param {object} client - Appwrite client object
 * @returns {Promise<{success: boolean, user?: object, message?: string}>}
 */
export async function verifyManager(teamId, client) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    try {
        const { account } = client;
        const user = await account.get();
        const memberships = await getTeamMembers({ teamId });
        const userMembership = memberships.memberships.find(
            (m) => m.userId === user.$id,
        );

        const isManager =
            userMembership?.roles.includes("manager") ||
            userMembership?.roles.includes("owner");

        if (!isManager) {
            return {
                success: false,
                message: "You do not have permission to perform this action.",
            };
        }

        return { success: true, user };
    } catch (error) {
        console.error("[verifyManager] Authorization check failed:", error);
        return {
            success: false,
            message: "Failed to verify permissions.",
        };
    }
}
