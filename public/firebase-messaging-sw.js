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

messaging.onBackgroundMessage(function (payload) {
    console.log("[Firebase SW] Background message received:", payload);

    // Customize notification here
    const notificationTitle =
        payload.notification?.title ||
        payload.data?.title ||
        "Softball Manager";
    const notificationOptions = {
        body:
            payload.notification?.body ||
            payload.data?.body ||
            "You have a new notification",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks for deep linking
self.addEventListener("notificationclick", (event) => {
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
                        // Navigate the existing window to the notification URL
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // No existing window, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            }),
    );
});
