import { useEffect, useRef } from "react";
import { client } from "@/utils/appwrite/client";

/**
 * Custom React hook to subscribe to real-time updates for a single game document.
 * Listens to Appwrite's Realtime channel and triggers a callback whenever the game is updated.
 *
 * @param {string} gameId - The ID of the game to subscribe to
 * @param {Object} options - Callback options
 * @param {Function} options.onGameUpdate - Callback triggered with the updated game document payload
 * @param {boolean} [options.enabled=true] - Whether the real-time subscription is active
 */
export function useGameRealtime(gameId, { onGameUpdate, enabled = true }) {
    const callbackRef = useRef(onGameUpdate);

    // Keep the callback reference fresh to avoid breaking or re-running the subscription effect
    useEffect(() => {
        callbackRef.current = onGameUpdate;
    }, [onGameUpdate]);

    useEffect(() => {
        if (!gameId || !enabled) {
            return;
        }

        let unsubscribe;
        let isCancelled = false;

        async function init() {
            const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const collectionId = import.meta.env
                .VITE_APPWRITE_GAMES_COLLECTION_ID;

            if (!databaseId || !collectionId) {
                console.warn(
                    "useGameRealtime: Missing databaseId or collectionId configuration.",
                );
                return;
            }

            // Sync user session to ensure authenticated websocket subscription
            try {
                const sessionResponse = await fetch("/api/session");
                if (sessionResponse.ok) {
                    const { session } = await sessionResponse.json();
                    if (isCancelled) return;
                    if (session) {
                        client.setSession(session);
                    }
                }
            } catch (err) {
                console.warn(
                    "useGameRealtime: Session synchronization failed, falling back to public channels:",
                    err.message,
                );
            }

            if (isCancelled) return;

            // Appwrite Realtime table subscription channel for specific document rows
            const channel = `databases.${databaseId}.tables.${collectionId}.rows`;

            try {
                unsubscribe = client.subscribe(channel, (response) => {
                    const data = response.payload;

                    // Verify this event matches our specific gameId
                    if (data && data.$id === gameId) {
                        // Check if the event is a row update
                        if (
                            response.events.some((e) => e.includes(".update"))
                        ) {
                            callbackRef.current?.(data);
                        }
                    }
                });
            } catch (err) {
                console.error("useGameRealtime: Subscription failed:", err);
            }
        }

        init();

        return () => {
            isCancelled = true;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [gameId, enabled]);
}
