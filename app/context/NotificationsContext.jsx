import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { getToken } from "firebase/messaging";
import { useOs } from "@mantine/hooks";
import { trackEvent } from "@/utils/analytics";
import {
    isPushSupported,
    getNotificationPermission,
    areNotificationsEnabled,
    areNotificationsDenied,
} from "@/utils/notifications";
import { getMessagingIfSupported } from "@/utils/firebase";

// Local storage key for push target ID
const PUSH_TARGET_KEY = "appwrite_push_target_id";

// Create Context
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
    const os = useOs();

    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pushTargetId, setPushTargetId] = useState(null);

    // Check support and permission on mount
    useEffect(() => {
        const supported = isPushSupported();
        setIsSupported(supported);

        if (supported) {
            setPermission(getNotificationPermission() || "default");

            // Check if we have a stored push target ID and verify it with the server
            const storedTargetId = localStorage.getItem(PUSH_TARGET_KEY);

            if (storedTargetId) {
                // Verify with server
                const verifyUrl = `/api/push-target?targetId=${encodeURIComponent(storedTargetId)}`;

                fetch(verifyUrl, {
                    method: "GET",
                    credentials: "include",
                })
                    .then(async (response) => {
                        if (response.ok) {
                            setPushTargetId(storedTargetId);
                            setIsSubscribed(true);
                        } else {
                            // Not valid, clear localStorage
                            localStorage.removeItem(PUSH_TARGET_KEY);
                            setPushTargetId(null);
                            setIsSubscribed(false);
                        }
                    })
                    .catch((err) => {
                        // On error, assume not valid
                        localStorage.removeItem(PUSH_TARGET_KEY);
                        setPushTargetId(null);
                        setIsSubscribed(false);
                    });
            }
        }
    }, []);

    /**
     * Register the service worker if not already registered
     * @returns {Promise<ServiceWorkerRegistration|null>}
     */
    const registerServiceWorker = useCallback(async () => {
        if (!("serviceWorker" in navigator)) {
            console.warn("Service workers are not supported");
            return null;
        }
        try {
            const registration = await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js",
                { scope: "/" },
            );
            console.log(
                "Firebase Messaging service worker registered:",
                registration.scope,
            );
            return registration;
        } catch (err) {
            console.error("Service worker registration failed:", err);
            throw new Error("Failed to register service worker");
        }
    }, []);

    /**
     * Request notification permission from the user
     * @returns {Promise<string>} The permission result
     */
    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            throw new Error(
                "Push notifications are not supported in this browser",
            );
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== "granted") {
                throw new Error(
                    result === "denied"
                        ? "Notification permission was denied. Please enable it in your browser settings."
                        : "Notification permission was dismissed",
                );
            }

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported]);

    /**
     * Subscribe to push notifications
     * This registers the service worker, gets permission, and creates a push target in Appwrite
     * @returns {Promise<Object>} The subscription result
     * @param {Object} [metadata={}] Optional metadata describing the client or subscription
     */
    const subscribe = useCallback(
        async (metadata = {}) => {
            if (!isSupported) {
                throw new Error(
                    "Push notifications are not supported in this browser",
                );
            }

            setIsLoading(true);
            setError(null);

            try {
                // Step 1: Register service worker
                const registration = await registerServiceWorker();
                if (!registration) {
                    throw new Error("Failed to register service worker");
                }

                // Step 2: Request permission if not already granted
                if (permission !== "granted") {
                    await requestPermission();
                }

                // Step 3: Get FCM token using Firebase SDK (browser only)
                const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
                if (!vapidKey) {
                    console.warn(
                        "VITE_FCM_VAPID_KEY not set - push subscription may not work",
                    );
                }
                const messaging = await getMessagingIfSupported();
                if (!messaging) {
                    throw new Error(
                        "Firebase Messaging is only supported in the browser",
                    );
                }
                const fcmToken = await getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: registration,
                });
                if (!fcmToken) {
                    throw new Error("Failed to get FCM token from Firebase");
                }

                // Step 4: Register push target with Appwrite via server API
                const providerId = import.meta.env.VITE_FCM_PROVIDER_ID;
                if (!providerId) {
                    throw new Error("FCM Provider ID not configured");
                }

                const response = await fetch("/api/push-target", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        fcmToken,
                        providerId,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Failed to register push target",
                    );
                }

                // Store the target ID for later use (unsubscribe)
                localStorage.setItem(PUSH_TARGET_KEY, result.targetId);
                setPushTargetId(result.targetId);
                setIsSubscribed(true);
                trackEvent("notifications-subscribe", {
                    os,
                    ...metadata,
                });

                return {
                    success: true,
                    targetId: result.targetId,
                };
            } catch (err) {
                console.error("Subscription error:", err);
                setError(err.message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [isSupported, permission, registerServiceWorker, requestPermission, os],
    );

    /**
     * Unsubscribe from push notifications
     * @returns {Promise<Object>} The unsubscription result
     */
    const unsubscribe = useCallback(async () => {
        if (!pushTargetId) {
            throw new Error("No active push subscription found");
        }

        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Delete push target from Appwrite via server API
            const response = await fetch("/api/push-target", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    targetId: pushTargetId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to delete push target");
            }

            // Step 2: Unsubscribe from browser push
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription =
                    await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
            }

            // Step 3: Clear local storage
            localStorage.removeItem(PUSH_TARGET_KEY);
            setPushTargetId(null);
            setIsSubscribed(false);
            trackEvent("notifications-unsubscribe", {
                os,
            });

            return { success: true };
        } catch (err) {
            console.error("Unsubscribe error:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [pushTargetId, os]);

    /**
     * Toggle subscription state
     * @returns {Promise<Object>} The result of subscribe or unsubscribe
     */
    const toggleSubscription = useCallback(async () => {
        if (isSubscribed) {
            return unsubscribe();
        } else {
            return subscribe();
        }
    }, [isSubscribed, subscribe, unsubscribe]);

    /**
     * Clear any error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Subscribe to a specific team's notifications
     */
    const subscribeToTeam = useCallback(
        async (teamId) => {
            if (!pushTargetId) {
                console.warn(
                    "Cannot subscribe to team without global push subscription",
                );
                return false;
            }

            try {
                const formData = new FormData();
                formData.append("intent", "subscribe");
                formData.append("teamId", teamId);
                formData.append("targetId", pushTargetId);

                const response = await fetch("/api/notifications/preferences", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok)
                    throw new Error("Failed to subscribe to team");

                trackEvent("subscribe-team-notifications", { teamId });
                return true;
            } catch (err) {
                console.error("Error subscribing to team:", err);
                return false;
            }
        },
        [pushTargetId],
    );

    /**
     * Unsubscribe from a specific team's notifications
     */
    const unsubscribeFromTeam = useCallback(
        async (teamId) => {
            if (!pushTargetId) return true;

            try {
                const formData = new FormData();
                formData.append("intent", "unsubscribe");
                formData.append("teamId", teamId);
                formData.append("targetId", pushTargetId);

                const response = await fetch("/api/notifications/preferences", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok)
                    throw new Error("Failed to unsubscribe from team");

                trackEvent("unsubscribe-team-notifications", { teamId });
                return true;
            } catch (err) {
                console.error("Error unsubscribing from team:", err);
                return false;
            }
        },
        [pushTargetId],
    );

    /**
     * Check if subscribed to a team
     */
    const checkTeamSubscription = useCallback(
        async (teamId) => {
            if (!pushTargetId) return false;

            try {
                const params = new URLSearchParams({
                    teamId,
                    targetId: pushTargetId,
                });
                const response = await fetch(
                    `/api/notifications/preferences?${params.toString()}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    return data.subscribed;
                }
                return false;
            } catch (err) {
                console.error("Error checking team subscription:", err);
                return false;
            }
        },
        [pushTargetId],
    );

    const value = {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        pushTargetId,
        isEnabled: areNotificationsEnabled(),
        isDenied: areNotificationsDenied(),
        requestPermission,
        subscribe,
        unsubscribe,
        toggleSubscription,
        clearError,
        subscribeToTeam,
        unsubscribeFromTeam,
        checkTeamSubscription,
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

// Export custom hook to use the context
export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error(
            "useNotifications must be used within a NotificationsProvider",
        );
    }
    return context;
}

// Export Context for edge cases
export { NotificationsContext };
