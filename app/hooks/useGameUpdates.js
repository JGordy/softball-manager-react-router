import { useEffect } from "react";
import { client } from "@/utils/appwrite/client";

export function useGameUpdates(gameId, { onNewLog, onDeleteLog }) {
    useEffect(() => {
        if (!gameId) return;

        let unsubscribe;
        let isCancelled = false;

        async function init() {
            const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const collectionId = import.meta.env
                .VITE_APPWRITE_GAME_LOGS_COLLECTION_ID;

            if (!databaseId || !collectionId) return;

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
                            onNewLog?.(data);
                        } else if (
                            response.events.some((e) => e.includes(".delete"))
                        ) {
                            onDeleteLog?.(data.$id);
                        }
                    }
                });
            } catch (err) {
                console.error("Realtime subscription failed:", err);
            }
        }

        init();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    }, [gameId, onNewLog, onDeleteLog]);
}
