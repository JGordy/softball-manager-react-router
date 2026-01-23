/**
 * Shared utilities for Service Workers
 */

/**
 * Normalizes notification data that might be JSON-stringified.
 * Common with Appwrite/FCM implementations.
 * @param {any} data - The raw data to normalize
 * @param {string} logPrefix - Prefix for error logging
 * @returns {object} Normalized data object
 */
function normalizeNotificationData(data, logPrefix = "[Service Worker]") {
    if (!data) return {};
    if (typeof data === "string") {
        try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch (error) {
            console.error(`${logPrefix} Failed to parse data JSON:`, error);
        }
        // If JSON.parse fails or isn't an object, return empty object to ensure consistency
        return {};
    }
    return data;
}

/**
 * Extracts a target URL from notification data.
 * Supports flat data.url and nested data.data.url (Appwrite pattern).
 * @param {object} data - The normalized data object
 * @returns {string} The extracted URL or "/" default
 */
function extractNotificationUrl(data) {
    // - When sending notifications via Firebase directly (console / client SDK),
    //   the target URL is typically provided as `data.url`.
    // - When sending notifications via Appwrite's FCM integration, the custom
    //   data payload is nested under a second `data` key, so the URL arrives as
    //   `data.data.url`.
    // We support both shapes here for compatibility with both providers.
    return data?.url || (data?.data && data.data.url) || "/";
}

/**
 * Normalizes and validates a URL to ensure it is absolute and valid.
 * @param {string} url - The URL to normalize
 * @param {string} base - The base origin
 * @returns {string} Absolute URL
 */
function normalizeUrl(url, base) {
    if (!url || typeof url !== "string") {
        return base;
    }

    try {
        // If it's relative (starts with / or has no scheme), resolve it against base.
        // If it's already absolute (http://...), the URL constructor handles it.
        return new URL(url, base).href;
    } catch (e) {
        console.error("[Service Worker] Invalid URL in notification:", url, e);
        return base;
    }
}

/**
 * Handles notification click navigation logic.
 * 1. Tries to find an existing window with the exact URL and focus it.
 * 2. Tries to find any window on the same origin, navigate it, and focus it.
 * 3. Falls back to opening a new window.
 * @param {string} urlToOpen - The absolute URL to open
 * @param {string} logPrefix - Prefix for logging
 */
async function handleNotificationClick(
    urlToOpen,
    logPrefix = "[Service Worker]",
) {
    const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
    });

    // 1. Try to find a window that is already at the target URL
    for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
            console.log(
                `${logPrefix} Found existing window with matching URL, focusing...`,
            );
            return await client.focus();
        }
    }

    // 2. If not found, try to find any window on the same origin and navigate it
    for (const client of clientList) {
        let sameOrigin = false;
        try {
            const clientUrl = new URL(client.url);
            sameOrigin = clientUrl.origin === self.location.origin;
        } catch (error) {
            console.error(
                `${logPrefix} Failed to parse client URL for origin check:`,
                error,
            );
        }

        if (sameOrigin && "focus" in client) {
            try {
                console.log(
                    `${logPrefix} Found existing window on same origin, navigating...`,
                );
                const navigatedClient = await client.navigate(urlToOpen);
                if (
                    navigatedClient &&
                    "focus" in navigatedClient &&
                    typeof navigatedClient.focus === "function"
                ) {
                    return await navigatedClient.focus();
                } else {
                    console.error(
                        `${logPrefix} Navigation completed but resulting client cannot be focused or is null:`,
                        navigatedClient,
                    );
                    // Continue to next client or fallback (Step 3)
                }
            } catch (error) {
                console.error(
                    `${logPrefix} Navigation failed for client:`,
                    error,
                );
                // Continue to next client or fallback
            }
        }
    }

    // 3. Fallback: open a new window
    if (clients.openWindow) {
        console.log(
            `${logPrefix} No suitable window found, opening new one...`,
        );
        return await clients.openWindow(urlToOpen);
    } else {
        console.warn(
            `${logPrefix} clients.openWindow is not available; cannot open window for URL: ${urlToOpen}`,
        );
        return null;
    }
}
