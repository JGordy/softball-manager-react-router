import { Account, Client } from "node-appwrite";
import { createCookie } from "react-router";

// Create a typed cookie for the session
export const sessionCookie = createCookie("appwrite-session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
});

/**
 * Creates an Appwrite client configured with a user session
 * This should be used in loaders/actions to make authenticated requests
 */
export async function createSessionClient(request) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID);

    // Get session from React Router cookie
    const session = await sessionCookie.parse(request.headers.get("Cookie"));

    if (session) {
        client.setSession(session);
    }

    return {
        get account() {
            return new Account(client);
        },
    };
}

/**
 * Creates an admin Appwrite client (for operations that don't require user session)
 * Use sparingly - only when you need to perform admin operations
 */
export function createAdminClient() {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY); // API Key for server-side operations

    return {
        get account() {
            return new Account(client);
        },
    };
}
