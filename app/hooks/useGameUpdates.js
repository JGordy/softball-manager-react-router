import { useEffect, useState, useRef } from "react";
import { client } from "@/utils/appwrite/client";

export function useGameUpdates(gameId, { onNewLog, onDeleteLog }) {
    const [status, setStatus] = useState("connecting");
    const handlersRef = useRef({ onNewLog, onDeleteLog });

    // Update refs whenever handlers change, without triggering effects
    useEffect(() => {
        handlersRef.current = { onNewLog, onDeleteLog };
    }, [onNewLog, onDeleteLog]);

    useEffect(() => {
        if (!gameId) {
            setStatus("idle");
            return;
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
                const { session } = await sessionResponse.json();
                if (session) {
                    client.setSession(session);
                }
            } catch (err) {
                console.error("WebSocket session sync failed:", err);
            }

            if (isCancelled) return;

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
            if (unsubscribe) unsubscribe();
        };
    }, [gameId]); // Only restart if the gameId changes

    return { status };
}
