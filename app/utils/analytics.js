/**
 * Safely track a custom event with Umami Analytics.
 * This wrapper checks for the existence of the window.umami object and handles
 * development mode logging.
 *
 * @param {string} name - The name of the event (e.g., 'Save Lineup')
 * @param {Object} [data] - Optional metadata for the event (e.g., { teamId: '123' })
 */
export const trackEvent = (name, data) => {
    try {
        if (typeof window !== "undefined" && window.umami) {
            window.umami.track(name, data);
        } else if (import.meta.env.DEV) {
            // Log to console in dev mode for debugging
            console.log(`[Umami Analytics] Track Event: "${name}"`, data || "");
        }
    } catch (error) {
        console.error("Error tracking event with Umami:", error);
    }
};

/**
 * Identify the current user with a unique ID.
 * This allows Umami to track the same user across multiple sessions.
 *
 * @param {string} userId - The unique user ID (e.g., Appwrite $id)
 */
export const identifyUser = (userId) => {
    try {
        if (typeof window !== "undefined" && window.umami) {
            window.umami.identify(userId);
        } else if (import.meta.env.DEV) {
            console.log(`[Umami Analytics] Identify User: "${userId}"`);
        }
    } catch (error) {
        console.error("Error identifying user with Umami:", error);
    }
};
