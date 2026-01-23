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
    return data?.url || (data?.data && data.data.url) || "/";
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
        if (client.url.includes(self.location.origin) && "focus" in client) {
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
    }
}
