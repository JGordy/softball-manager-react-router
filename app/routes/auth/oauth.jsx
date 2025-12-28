import { redirect } from "react-router";
import { createAdminClient } from "@/utils/appwrite/server";

/**
 * Loader to handle redirection to Appwrite OAuth2 providers.
 * Path: /auth/oauth?provider=google
 */
export async function loader({ request }) {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");
    const origin = url.origin;

    if (!provider) {
        return redirect("/login?error=Missing provider");
    }

    try {
        const { account } = createAdminClient();

        // Use the official Node SDK method to get the redirect URL
        // Note: In the Node SDK, this is createOAuth2Token, whereas in the Web SDK it is createOAuth2Session.
        const redirectUrl = await account.createOAuth2Token(
            provider,
            `${origin}/auth/callback`,
            `${origin}/login?error=OAuth failed`,
        );

        return redirect(redirectUrl);
    } catch (error) {
        console.error("OAuth redirect error:", error);
        return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
}
