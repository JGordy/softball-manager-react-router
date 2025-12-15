// Firebase Messaging Service Worker for background push notifications
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
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
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        data: payload.data || {},
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
