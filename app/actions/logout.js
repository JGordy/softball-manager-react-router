import { redirect } from "react-router";
import { createSessionClient } from "@/utils/appwrite/server";

/**
 * Server-side logout action
 */
export async function logoutAction({ request }) {
    console.log({ request });
    const { account } = await createSessionClient(request);
    console.log({ account });

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
    return redirect("/login", {
        headers: {
            "Set-Cookie":
                "appwrite-session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
        },
    });
}
