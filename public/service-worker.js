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
            data = {
                title: payload.title || data.title,
                body: payload.body || data.body,
                icon: payload.icon || data.icon,
                badge: payload.badge || data.badge,
                data: {
                    ...data.data,
                    ...payload.data,
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
        vibrate: [100, 50, 100],
        requireInteraction: false,
        actions: [
            {
                action: "open",
                title: "Open",
            },
            {
                action: "dismiss",
                title: "Dismiss",
            },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks for deep linking
self.addEventListener("notificationclick", (event) => {
    console.log("[Service Worker] Notification clicked:", event);

    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    notification.close();

    // Handle dismiss action
    if (action === "dismiss") {
        return;
    }

    // Get the URL to open (from notification data or default)
    let urlToOpen = data.url || "/";

    // Ensure the URL is absolute for clients.openWindow
    if (urlToOpen.startsWith("/")) {
        urlToOpen = new URL(urlToOpen, self.location.origin).href;
    }

    console.log("[Service Worker] Opening URL:", urlToOpen);

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already an open window we can focus
                for (const client of clientList) {
                    if (
                        client.url.includes(self.location.origin) &&
                        "focus" in client
                    ) {
                        console.log(
                            "[Service Worker] Found existing window, navigating...",
                        );
                        // Navigate the existing window to the notification URL
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // No existing window, open a new one
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
