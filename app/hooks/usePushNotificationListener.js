import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";
import { getMessagingIfSupported } from "@/utils/firebase";
import { showNotification } from "@/utils/showNotification";

/**
 * Handle navigation for notification clicks
 * Supports internal SPA navigation and external links with security best practices
 * @param {string} url - The URL to navigate to
 * @param {function} navigate - React Router navigate function
 */
const handleNotificationNavigation = (url, navigate) => {
    if (!url) return;

    // If it's a relative URL
    if (url.startsWith("/")) {
        navigate(url);
        return;
    }

    try {
        const targetUrl = new URL(url);

        // If it's the same origin, use SPA navigation
        if (targetUrl.origin === window.location.origin) {
            const path = targetUrl.pathname + targetUrl.search + targetUrl.hash;
            navigate(path);
        } else {
            // Otherwise open in a new tab
            const newWindow = window.open(url, "_blank", "noopener,noreferrer");
            if (newWindow) {
                newWindow.opener = null;
            }
        }
    } catch (e) {
        // If the URL is invalid or parsing fails, attempt to open as-is in a new tab
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (newWindow) {
            newWindow.opener = null;
        }
    }
};

/**
 * Custom hook to listen for FCM foreground messages
 * Shows a Mantine notification that supports deep-linking on click
 */
export function usePushNotificationListener() {
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribe;

        getMessagingIfSupported()
            .then((messaging) => {
                if (messaging) {
                    unsubscribe = onMessage(messaging, (payload) => {
                        let data = payload.data || {};

                        // Handle potential stringified data block from Appwrite/FCM
                        if (typeof data === "string") {
                            try {
                                data = JSON.parse(data);
                            } catch (e) {
                                console.error(
                                    "[Foreground Message] Failed to parse notification data:",
                                    e,
                                );
                            }
                        }

                        // Some providers (e.g. Appwrite via FCM) send a flat `data.url`,
                        // while others (e.g. raw Firebase/FCM console) wrap custom data
                        // inside a nested `data` object (`data.data.url`). We intentionally
                        // support both shapes here for backward- and cross-provider compatibility.
                        const url = data.url || (data.data && data.data.url);
                        const notificationId = `push-${Date.now()}`;

                        showNotification({
                            id: notificationId,
                            title:
                                payload.notification?.title ||
                                data.title ||
                                "Notification",
                            message:
                                payload.notification?.body || data.body || "",
                            variant: "info",
                            autoClose: 5000,
                            onClick: () => {
                                // Immediately hide the notification and navigate
                                notifications.hide(notificationId);
                                handleNotificationNavigation(url, navigate);
                            },
                        });
                    });
                }
            })
            .catch((error) => {
                console.error(
                    "[Push Notification] Failed to initialize Firebase messaging:",
                    error,
                );
            });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [navigate]);
}
