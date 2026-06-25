import { redirect } from "react-router";
import { userContext } from "@/contexts/router";
import { isMobileUserAgent } from "@/utils/device";

/**
 * Checks if user has an active session and redirects to home if authenticated.
 * Used in auth route loaders (login, register) to prevent authenticated users
 * from accessing these pages.
 *
 * @param {Request} request - The incoming request object
 * @param {string} redirectTo - The path to redirect to if authenticated
 * @returns {Promise<Response|null>} Redirect response if authenticated, null otherwise
 */
export async function redirectIfAuthenticated(
    request,
    context,
    redirectTo = null,
) {
    const user = context.get(userContext);

    if (user) {
        // User is already logged in, redirect
        const isMobile = isMobileUserAgent(request);
        const destination = redirectTo || (!isMobile ? "/" : "/dashboard");

        return redirect(destination);
    }

    return null;
}
