// Firebase initialization for FCM push notifications
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

export async function getMessagingIfSupported() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
            // Only import in browser using dynamic import
            const { getMessaging, isSupported } = await import(
                "firebase/messaging"
            );
            const supported = await isSupported();
            if (supported) {
                return getMessaging(app);
            }
        } catch (err) {
            console.warn("Failed to check if messaging is supported:", err);
            return null;
        }
    }
    return null;
}
