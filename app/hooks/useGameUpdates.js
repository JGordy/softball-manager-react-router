import { useEffect, useState, useRef } from "react";
import { DateTime } from "luxon";
import { client } from "@/utils/appwrite/client";

export function useGameUpdates(
    gameId,
    { onNewLog, onUpdateLog, onDeleteLog, gameDate, gameFinal },
) {
    const [status, setStatus] = useState("connecting");
    const handlersRef = useRef({ onNewLog, onUpdateLog, onDeleteLog });

    // Update refs whenever handlers change, without triggering effects
    useEffect(() => {
        handlersRef.current = { onNewLog, onUpdateLog, onDeleteLog };
    }, [onNewLog, onUpdateLog, onDeleteLog]);

    useEffect(() => {
        if (!gameId) {
            setStatus("idle");
            return;
        }

        // Check if we should even attempt to connect
        if (gameFinal) {
            setStatus("idle");
            return;
        }

        if (gameDate) {
            const now = DateTime.now();
            const start = DateTime.fromISO(gameDate);
            const end = start.plus({ minutes: 90 });

            // If game is in the future or more than 1.5 hours past start, stay idle
            if (now < start || now > end) {
                setStatus("idle");
                return;
            }
        }

        let unsubscribe;
        let isCancelled = false;

        async function init() {
            setStatus("connecting");
            const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const collectionId = import.meta.env
                .VITE_APPWRITE_GAME_LOGS_COLLECTION_ID;

            if (!databaseId || !collectionId) {
                setStatus("error");
                return;
            }

            try {
                const sessionResponse = await fetch("/api/session");
                if (!sessionResponse.ok) {
                    throw new Error(`HTTP ${sessionResponse.status}`);
                }
                const { session } = await sessionResponse.json();
                if (isCancelled) return;

                if (session) {
                    client.setSession(session);
                }
            } catch (err) {
                console.warn(
                    "WebSocket session sync failed, attempting guest connection:",
                    err,
                );
                // We continue here to allow public/guest read access if configured on the table
            }

            if (isCancelled) return;

            // Note: Appwrite Tables API currently requires collection-level row subscriptions.
            // Row-level attribute filtering (gameId) is performed client-side in the callback.
            const channels = [
                `databases.${databaseId}.tables.${collectionId}.rows`,
            ];

            try {
                unsubscribe = client.subscribe(channels, (response) => {
                    const data = response.payload;

                    if (data.gameId === gameId) {
                        if (
                            response.events.some((e) => e.includes(".create"))
                        ) {
                            handlersRef.current.onNewLog?.(data);
                        } else if (
                            response.events.some((e) => e.includes(".update"))
                        ) {
                            handlersRef.current.onUpdateLog?.(data);
                        } else if (
                            response.events.some((e) => e.includes(".delete"))
                        ) {
                            handlersRef.current.onDeleteLog?.(data.$id);
                        }
                    }
                });
                setStatus("connected");
            } catch (err) {
                console.error("Realtime subscription failed:", err);
                setStatus("error");
            }
        }

        init();

        return () => {
            isCancelled = true;
            setStatus("idle");
            if (unsubscribe) unsubscribe();
        };
    }, [gameId, gameDate, gameFinal]);

    return { status };
}
