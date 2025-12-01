import { Users } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";

/**
 * Check if a user has a password set
 * Used to determine if invited user needs to create a password
 */
export async function checkUserHasPassword({ userId }) {
    try {
        const { account } = createAdminClient();
        const users = new Users(account.client);

        const user = await users.get({ userId });

        return {
            hasPassword: !!user.password,
            user: {
                id: user.$id,
                email: user.email,
                name: user.name,
            },
        };
    } catch (error) {
        console.error("Error checking user password:", error);
        throw new Error(error.message || "Failed to check user status.");
    }
}
