// Firebase Messaging Service Worker for background push notifications
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
    // For project identification not authorization, so this is safe to be public
    apiKey: "AIzaSyC57SjPhxUNhLnh07KtC7BDP1UjD_LzruM",
    authDomain: "softball-lineup-creator.firebaseapp.com",
    projectId: "softball-lineup-creator",
    storageBucket: "softball-lineup-creator.firebasestorage.app",
    messagingSenderId: "504973007646",
    appId: "1:504973007646:web:3729eecabe4a568900470f",
    measurementId: "G-G3SDV6BS74",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
    console.log("[Firebase SW] Background message received:", payload);

    // If there's a notification block, the browser might show it automatically.
    // We only want to show a manual notification if we need to customize it
    // or if the automatic one is missing.
    // To avoid double notifications, we use a unique tag.

    let data = payload.data || {};
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (error) {
            console.error(
                "[Firebase SW] Failed to parse payload.data JSON in background message:",
                error,
            );
            data = {};
        }
    }

    // Customize notification content
    const notificationTitle =
        payload.notification?.title || data.title || "Softball Manager";

    const notificationOptions = {
        body:
            payload.notification?.body ||
            data.body ||
            "You have a new notification",
        icon: data.icon || "/android-chrome-192x192.png",
        badge: data.badge || "/favicon-32x32.png",
        data: data,
        // The tag ensures that if the browser automatically shows a notification
        // AND this manual one triggers, they will merge/replace rather than duplicate.
        // Use a more specific tag if possible, otherwise use a default.
        tag: data.tag || data.type || "softball-manager-notification",
        renotify: true,
    };

    return self.registration.showNotification(
        notificationTitle,
        notificationOptions,
    );
});

// Handle notification clicks for deep linking
self.addEventListener("notificationclick", (event) => {
    console.log("[Firebase SW] Notification clicked:", event);

    const notification = event.notification;
    const action = event.action;
    let data = notification.data || {};

    // Appwrite/FCM sometimes stringifies the data object
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error(
                "[Firebase SW] Failed to parse notification data:",
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

    console.log("[Firebase SW] Opening URL:", urlToOpen);

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
                        return client
                            .navigate(urlToOpen)
                            .then((c) => {
                                if (!c) {
                                    console.error(
                                        "[Firebase SW] Navigation did not return a client for URL:",
                                        urlToOpen,
                                    );
                                    return;
                                }

                                if (
                                    "focus" in c &&
                                    typeof c.focus === "function"
                                ) {
                                    return c.focus();
                                }

                                console.error(
                                    "[Firebase SW] Navigated client does not support focus for URL:",
                                    urlToOpen,
                                );
                            })
                            .catch((error) => {
                                console.error(
                                    "[Firebase SW] Error navigating client to URL:",
                                    urlToOpen,
                                    error,
                                );
                            });
                    }
                }

                // 3. Fallback: open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            }),
    );
});
