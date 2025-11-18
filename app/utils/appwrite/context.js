import { createContext } from "react-router";
import { createSessionClient } from "./server";

/**
 * Server-side context for Appwrite session
 * This allows you to access the Appwrite client from middleware/loaders/actions
 */
export const appwriteContext = createContext();

/**
 * Initialize Appwrite client and store in context
 * This should be called in the layout middleware
 */
export async function initializeAppwriteContext({ context, request }) {
    const client = await createSessionClient(request);
    context.set(appwriteContext, client);
    return client;
}

/**
 * Get the Appwrite client from context (SSR) or create new one (client-side navigation)
 * Use this in loaders/actions instead of recreating the client
 */
export async function getAppwriteClient({ context, request }) {
    // Server-side: try to use context from middleware
    if (context) {
        const client = context.get(appwriteContext);
        if (client) {
            return client;
        }
    }

    // Client-side navigation or context not initialized: create new session client
    return await createSessionClient(request);
}

/**
 * Get the current user from context (SSR) or new client (client-side navigation)
 * Use this in child route loaders instead of recreating the client
 */
export async function getCurrentUser({ context, request }) {
    const client = await getAppwriteClient({ context, request });

    try {
        return await client.account.get();
    } catch (error) {
        return null;
    }
}
