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

    // Always construct a normalized data object so clicks can deep-link correctly,
    // even when the payload includes a notification object.
    const rawData = payload && payload.data ? { ...payload.data } : {};

    if (payload && payload.notification) {
        // Merge notification fields into the data so the content matches
        // what users see, and so click handling has access to the same info.
        if (payload.notification.title && !rawData.title) {
            rawData.title = payload.notification.title;
        }
        if (payload.notification.body && !rawData.body) {
            rawData.body = payload.notification.body;
        }
        if (payload.notification.icon && !rawData.icon) {
            rawData.icon = payload.notification.icon;
        }
        if (payload.notification.badge && !rawData.badge) {
            rawData.badge = payload.notification.badge;
        }
    }

    const data = normalizeNotificationData(rawData, "[Firebase SW]");

    // Customize notification content
    const notificationTitle = data.title || "RostrHQ";

    const notificationOptions = {
        body: data.body || "You have a new notification",
        icon: normalizeUrl(
            data.icon || "/android-chrome-192x192.png",
            self.location.origin,
        ),
        badge: normalizeUrl(
            data.badge || "/favicon-32x32.png",
            self.location.origin,
        ),
        data: data,
        // The tag ensures that if multiple notifications are sent,
        // they will merge/replace rather than duplicate.
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
