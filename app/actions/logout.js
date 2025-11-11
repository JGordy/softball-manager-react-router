import { redirect } from "react-router";
import { createSessionClient, sessionCookie } from "~/utils/appwrite/server";

/**
 * Server-side logout action
 */
export async function logoutAction({ request }) {
    const { account } = await createSessionClient(request);

    try {
        // Delete session on Appwrite
        await account.deleteSession("current");
    } catch (error) {
        // Session might already be invalid, that's ok
        console.log("Error deleting session:", error);
    }

    // Delete session cookie and redirect to login
    return redirect("/login", {
        headers: {
            "Set-Cookie": await sessionCookie.serialize("", {
                maxAge: 0,
            }),
        },
    });
}
