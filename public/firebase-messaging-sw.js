// Firebase Messaging Service Worker for background push notifications
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);
importScripts("/sw-utils.js");

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

    const data = normalizeNotificationData(payload.data, "[Firebase SW]");

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
    const data = normalizeNotificationData(notification.data, "[Firebase SW]");

    notification.close();

    // Handle dismiss action
    if (action === "dismiss") {
        return;
    }

    // Get the URL to open (from notification data or default)
    let urlToOpen = extractNotificationUrl(data);

    // Ensure the URL is absolute and valid
    urlToOpen = normalizeUrl(urlToOpen, self.location.origin);

    event.waitUntil(handleNotificationClick(urlToOpen, "[Firebase SW]"));
});
