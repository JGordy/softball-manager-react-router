import { redirect } from "react-router";

/**
 * Server-side logout action
 */
export async function logoutAction({ client, redirectTo = "/" }) {
    const { account } = client;

    try {
        // Delete session on Appwrite
        await account.deleteSession("current");
    } catch (error) {
        // Session might already be invalid, that's ok
        console.log("Error deleting session:", error);
    }

    // Clear server-side session cookie and redirect to login
    // Note: Client-side Appwrite cookies (a_session_*) are on .appwrite.io domains
    // and will expire naturally. They don't interfere with server-side auth.
    return redirect(redirectTo, {
        headers: {
            "Set-Cookie":
                "appwrite-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
        },
    });
}
