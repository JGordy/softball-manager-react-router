import { redirect } from "react-router";
import {
    serializeSessionCookie,
    createAdminClient,
} from "@/utils/appwrite/server";
import { createDocument, readDocument } from "@/utils/databases";
import { Permission, Role } from "node-appwrite";

/**
 * Loader to handle the callback from Appwrite OAuth2.
 * Path: /auth/callback?userId=...&secret=...
 */
export async function loader({ request }) {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const secret = url.searchParams.get("secret");

    if (!userId || !secret) {
        console.error("Callback loader - Missing parameters:", {
            userId,
            missingSecret: !secret,
        });
        throw redirect("/login?error=invalid_session");
    }

    try {
        const adminVars = createAdminClient();
        const { account: adminAccount, users: adminUsers } = adminVars;

        // Exchange the temporary token for a persistent session
        const session = await adminAccount.createSession(userId, secret);

        // --- Ensure User Document exists in Database ---
        try {
            await readDocument("users", userId, [], adminVars);
        } catch (readErr) {
            // If document does not exist (404), create it
            if (readErr.code === 404) {
                try {
                    const userAccount = await adminUsers.get(userId);
                    const docPermissions = [
                        Permission.read(Role.any()),
                        Permission.update(Role.user(userId)),
                        Permission.delete(Role.user(userId)),
                    ];
                    await createDocument(
                        "users",
                        userId,
                        {
                            userId: userId,
                            firstName:
                                userAccount.name?.split(" ")[0] || "User",
                            lastName:
                                userAccount.name
                                    ?.split(" ")
                                    .slice(1)
                                    .join(" ") || "",
                            email: userAccount.email,
                        },
                        docPermissions,
                        adminVars,
                    );
                } catch (createErr) {
                    console.error(
                        "Callback loader - Failed to create user document:",
                        createErr.message,
                    );
                }
            } else {
                console.warn(
                    "Callback loader - Error checking user document:",
                    readErr.message,
                );
            }
        }
        // -----------------------------------------------

        // Prepare the session cookie using the NEW persistent session secret
        const cookieHeader = serializeSessionCookie(session.secret);

        throw redirect("/", {
            headers: {
                "Set-Cookie": cookieHeader,
            },
        });
    } catch (error) {
        // If it's already a Response (e.g., a thrown redirect), re-throw it
        if (error instanceof Response) throw error;
        console.error("OAuth callback error:", error);
        throw redirect("/login?error=callback_error");
    }
}
