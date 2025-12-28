import { createContext } from "react";
import { createSessionClient } from "./server";

/**
 * Server-side context for Appwrite session
 * This allows you to access the Appwrite client from middleware/loaders/actions
 */
export const appwriteContext = createContext();

/**
 * Middleware to initialize Appwrite context
 * Call this in your root middleware or a parent route middleware
 */
export async function initializeAppwriteContext({ context, request }) {
    const client = await createSessionClient(request);
    context.set(appwriteContext, client);
    return client;
}

/**
 * Get the Appwrite client from context
 * Use this in loaders/actions instead of recreating the client
 */
export function getAppwriteClient(context) {
    const client = context.get(appwriteContext);

    if (!client) {
        throw new Error(
            "Appwrite context not initialized. Call initializeAppwriteContext in a parent middleware.",
        );
    }

    return client;
}

/**
 * Get the current user from context
 * Use this in child route loaders instead of recreating the client
 */
export async function getCurrentUser(context) {
    const client = getAppwriteClient(context);

    try {
        return await client.account.get();
    } catch (error) {
        return null;
    }
}
