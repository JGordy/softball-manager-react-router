import { redirect } from "react-router";
import { createSessionClient } from "@/utils/appwrite/server";
import { isMobileUserAgent } from "@/utils/device";

/**
 * Checks if user has an active session and redirects to home if authenticated.
 * Used in auth route loaders (login, register) to prevent authenticated users
 * from accessing these pages.
 *
 * @param {Request} request - The incoming request object
 * @param {string} redirectTo - The path to redirect to if authenticated (default: "/dashboard")
 * @returns {Promise<Response|null>} Redirect response if authenticated, null otherwise
 */
export async function redirectIfAuthenticated(
    request,
    redirectTo = "/dashboard",
) {
    try {
        const { account } = await createSessionClient(request);
        await account.get(); // Succeeds if valid session exists, throws if no session

        // User is already logged in, redirect
        const isMobile = isMobileUserAgent(request);
        const destination = !isMobile ? "/" : redirectTo;

        return redirect(destination);
    } catch (error) {
        // No valid session found, allow access to the page
        return null;
    }
}
