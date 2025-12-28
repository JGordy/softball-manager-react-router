import { redirect } from "react-router";
import {
    serializeSessionCookie,
    createAdminClient,
    createSessionClientFromSecret,
} from "@/utils/appwrite/server";
import { updateDocument } from "@/utils/databases";

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
        const { account: adminAccount } = createAdminClient();

        // Exchange the temporary token for a persistent session
        const session = await adminAccount.createSession(userId, secret);

        // --- Fetch and Save Google Avatar while token is fresh ---
        try {
            const { account: sessionAccount } = createSessionClientFromSecret(
                session.secret,
            );
            const identities = await sessionAccount.listIdentities();
            const googleIdentity = identities.identities.find(
                (i) => i.provider === "google",
            );

            if (googleIdentity?.providerAccessToken) {
                const response = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${googleIdentity.providerAccessToken}`,
                        },
                    },
                );

                if (!response.ok) {
                    console.error(
                        "Google API error:",
                        response.status,
                        response.statusText,
                    );
                    throw new Error("Failed to fetch Google user info");
                }

                const googleUser = await response.json();

                if (googleUser.picture) {
                    // 1. Update preferences
                    await sessionAccount.updatePrefs({
                        avatarUrl: googleUser.picture,
                    });
                    // 2. Update database
                    try {
                        await updateDocument("users", userId, {
                            avatarUrl: googleUser.picture,
                        });
                    } catch (dbErr) {
                        console.warn(
                            "Callback loader - DB sync failed:",
                            dbErr.message,
                        );
                    }
                }
            }
        } catch (avatarErr) {
            console.warn(
                "Callback loader - Avatar fetch failed:",
                avatarErr.message,
            );
        }
        // --------------------------------------------------------

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
