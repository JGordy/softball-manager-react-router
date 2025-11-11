import { redirect } from "react-router";
import { createSessionClient } from "~/utils/appwrite/server";

/**
 * Server-side loader to check authentication
 * This runs on the server and can access session cookies
 */
export async function loader({ request }) {
    const { account } = await createSessionClient(request);

    try {
        const user = await account.get();
        return { user, isAuthenticated: true };
    } catch (error) {
        // No valid session
        return { user: null, isAuthenticated: false };
    }
}

/**
 * Example: Protected route loader
 * Use this pattern in routes that require authentication
 */
export async function protectedLoader({ request }) {
    const { account } = await createSessionClient(request);

    try {
        const user = await account.get();

        // You can also check email verification
        if (!user.emailVerification) {
            throw redirect("/verify");
        }

        return { user };
    } catch (error) {
        // Redirect to login if not authenticated
        throw redirect("/login");
    }
}
