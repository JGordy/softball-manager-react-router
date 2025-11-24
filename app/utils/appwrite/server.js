import { Client, Account, Databases, TablesDB } from "node-appwrite";
import { appwriteConfig } from "./config.js";

// Cookie configuration
const COOKIE_NAME = "appwrite-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Serialize a session secret into a Set-Cookie header
 * We manually create the cookie to ensure the raw JWT session secret is stored, not a JSON-encoded value.
 */
export function serializeSessionCookie(secret) {
    const isProduction = process.env.NODE_ENV === "production";
    const parts = [
        `${COOKIE_NAME}=${secret}`,
        `Max-Age=${COOKIE_MAX_AGE}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
    ];

    if (isProduction) {
        parts.push("Secure");
    }

    return parts.join("; ");
}

/**
 * Parse the session secret from the Cookie header
 */
export function parseSessionCookie(cookieHeader) {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));

    if (!sessionCookie) return null;

    return sessionCookie.substring(COOKIE_NAME.length + 1);
}

/**
 * Creates an Appwrite client configured with a user session
 * This should be used in loaders/actions to make authenticated requests
 */
export async function createSessionClient(request) {
    appwriteConfig.validate();

    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId);

    // Get session from cookie
    const cookieHeader = request.headers.get("Cookie");
    const session = parseSessionCookie(cookieHeader);

    if (session) {
        client.setSession(session);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get tablesDB() {
            return new TablesDB(client);
        },
    };
}

/**
 * Creates an admin Appwrite client (for operations that don't require user session)
 * Use sparingly - only when you need to perform admin operations
 */
export function createAdminClient() {
    appwriteConfig.validate(true); // Require API key for admin operations

    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId)
        .setKey(appwriteConfig.apiKey); // API Key for server-side operations

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get tablesDB() {
            return new TablesDB(client);
        },
    };
}
