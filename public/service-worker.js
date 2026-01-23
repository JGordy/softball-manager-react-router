/**
 * Service Worker for Push Notifications
 * Handles push events and notification clicks for deep linking
 */

// Handle push events from the server
self.addEventListener("push", (event) => {
    console.log("[Service Worker] Push received:", event);

    let data = {
        title: "Softball Manager",
        body: "You have a new notification",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        data: {
            url: "/",
        },
    };

    // Try to parse the push data
    if (event.data) {
        try {
            const payload = event.data.json();

            // Extract from top-level or data sub-object
            // Normalize data to object if it's a JSON string
            const rawPayloadData = payload.data;
            let payloadData = {};
            if (typeof rawPayloadData === "string") {
                try {
                    const parsed = JSON.parse(rawPayloadData);
                    if (parsed && typeof parsed === "object") {
                        payloadData = parsed;
                    }
                } catch (parseError) {
                    // Ignore parse error and fall back to empty object
                }
            } else if (rawPayloadData && typeof rawPayloadData === "object") {
                payloadData = rawPayloadData;
            }

            data = {
                title: payload.title || payloadData.title || data.title,
                body: payload.body || payloadData.body || data.body,
                icon: payload.icon || payloadData.icon || data.icon,
                badge: payload.badge || payloadData.badge || data.badge,
                data: {
                    ...data.data,
                    ...payloadData,
                },
            };
        } catch (error) {
            console.error("[Service Worker] Error parsing push data:", error);
            // Try to use text if JSON parsing fails
            const text = event.data.text();
            if (text) {
                data.body = text;
            }
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        data: data.data,
        // The tag ensures that if multiple notifications are sent, they merge/replace.
        // Use a more specific tag if possible, otherwise use a default.
        tag:
            data.data?.tag ||
            data.data?.type ||
            "softball-manager-notification",
        renotify: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks for deep linking
self.addEventListener("notificationclick", (event) => {
    console.log("[Service Worker] Notification clicked:", event);

    const notification = event.notification;
    const action = event.action;
    let data = notification.data || {};

    // Appwrite/FCM sometimes stringifies the data object
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error(
                "[Service Worker] Failed to parse notification data:",
                e,
            );
        }
    }

    notification.close();

    // Handle dismiss action
    if (action === "dismiss") {
        return;
    }

    // Get the URL to open (from notification data or default)
    // NOTE:
    // - When sending notifications via Firebase directly (console / client SDK),
    //   the target URL is typically provided as `data.url`.
    // - When sending notifications via Appwrite's FCM integration, the custom
    //   data payload is nested under a second `data` key, so the URL arrives as
    //   `data.data.url`.
    // We support both shapes here for compatibility with both providers.
    let urlToOpen = data.url || (data.data && data.data.url) || "/";

    // Ensure the URL is absolute for clients.openWindow
    if (urlToOpen.startsWith("/")) {
        urlToOpen = new URL(urlToOpen, self.location.origin).href;
    }

    console.log("[Service Worker] Opening URL:", urlToOpen);

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // 1. Try to find a window that is already at the target URL
                for (const client of clientList) {
                    if (client.url === urlToOpen && "focus" in client) {
                        return client.focus();
                    }
                }

                // 2. If not found, try to find any window on the same origin and navigate it
                for (const client of clientList) {
                    if (
                        client.url.includes(self.location.origin) &&
                        "focus" in client
                    ) {
                        console.log(
                            "[Service Worker] Found existing window, navigating...",
                        );
                        return client
                            .navigate(urlToOpen)
                            .then((c) => {
                                if (!c || typeof c.focus !== "function") {
                                    console.error(
                                        "[Service Worker] Navigation completed but resulting client cannot be focused:",
                                        c,
                                    );
                                    return;
                                }
                                return c.focus();
                            })
                            .catch((error) => {
                                console.error(
                                    "[Service Worker] Failed to navigate existing window:",
                                    error,
                                );
                            });
                    }
                }

                // 3. Fallback: open a new window
                if (clients.openWindow) {
                    console.log(
                        "[Service Worker] No existing window, opening new one...",
                    );
                    return clients.openWindow(urlToOpen);
                }
            }),
    );
});

// Handle notification close (for analytics or cleanup)
self.addEventListener("notificationclose", (event) => {
    console.log("[Service Worker] Notification closed:", event);
    // Could send analytics here if needed
});

// Handle service worker install
self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing...");
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activating...");
    // Take control of all clients immediately
    event.waitUntil(clients.claim());
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
    console.log("[Service Worker] Message received:", event.data);

    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
