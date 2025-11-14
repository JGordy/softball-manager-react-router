import { redirect } from "react-router";
import { createAdminClient, sessionCookie } from "@/utils/appwrite/server";

/**
 * Server-side login action
 * This creates a session on Appwrite and stores it in an HttpOnly cookie
 */
export async function action({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
        return {
            error: "Email and password are required",
        };
    }

    try {
        const { account } = createAdminClient();

        // Create email session
        const session = await account.createEmailPasswordSession(
            email,
            password,
        );

        // Set session cookie in response using React Router's cookie utility
        return redirect("/", {
            headers: {
                "Set-Cookie": await sessionCookie.serialize(session.secret),
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return {
            error: error.message || "Invalid credentials. Please try again.",
        };
    }
}
