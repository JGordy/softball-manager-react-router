/**
 * Service Worker for Push Notifications
 * Handles push events and notification clicks for deep linking
 */

importScripts("/sw-utils.js");

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
            const payloadData = normalizeNotificationData(
                payload.data,
                "[Service Worker]",
            );

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
    const data = normalizeNotificationData(
        notification.data,
        "[Service Worker]",
    );

    notification.close();

    // Handle dismiss action
    if (action === "dismiss") {
        return;
    }

    // Get the URL to open (from notification data or default)
    let urlToOpen = extractNotificationUrl(data);

    // Ensure the URL is absolute and valid
    urlToOpen = normalizeUrl(urlToOpen, self.location.origin);

    event.waitUntil(handleNotificationClick(urlToOpen, "[Service Worker]"));
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
