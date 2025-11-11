import { createContext } from "react-router";
import { createSessionClient } from "./server";

/**
 * Server-side context for Appwrite session
 * This allows you to access the Appwrite client from any loader/action
 * without passing the request object around
 */
export const [getAppwriteContext, setAppwriteContext] = createContext();

/**
 * Middleware to initialize Appwrite context
 * Call this in your root loader or a parent route loader
 */
export async function initializeAppwriteContext(request) {
    const client = await createSessionClient(request);
    setAppwriteContext(client);
    return client;
}

/**
 * Get the current user from context
 * Use this in child route loaders instead of recreating the client
 */
export async function getCurrentUser() {
    const context = getAppwriteContext();

    if (!context) {
        throw new Error(
            "Appwrite context not initialized. Call initializeAppwriteContext in a parent loader.",
        );
    }

    try {
        return await context.account.get();
    } catch (error) {
        return null;
    }
}
