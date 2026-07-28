import { useEffect } from "react";
import { client } from "@/utils/appwrite/client";
import { Realtime, ID, Permission, Role } from "appwrite";

// Keep the Realtime instance at the module level to prevent garbage collection
let globalRealtime = null;

/**
 * PresenceTracker component that registers the user's presence via Appwrite's Realtime service.
 * It automatically maps the active session to a WebSockets-based presence status,
 * which automatically expires and cleans up when the connection is closed.
 *
 * @returns {null} This component does not render any visual elements.
 */
export function PresenceTracker() {
    useEffect(() => {
        let isMounted = true;
        const presenceId = ID.unique();

        const setupPresence = async () => {
            try {
                // Fetch current user's session JWT from our backend
                const sessionResponse = await fetch("/api/session");
                if (!sessionResponse.ok || !isMounted) return;

                const { jwt } = await sessionResponse.json();
                if (!jwt || !isMounted) return;

                // Authenticate the client-side Appwrite instance using the JWT
                client.setJWT(jwt);

                if (!globalRealtime) {
                    globalRealtime = new Realtime(client);
                }

                // Call upsertPresence to bind presence to the WebSocket connection.
                // It will be deleted automatically when the connection closes.
                await globalRealtime.upsertPresence({
                    presenceId,
                    status: "online",
                    permissions: [Permission.read(Role.users())],
                });
            } catch (error) {
                console.debug(
                    "PresenceTracker - Failed to initialize presence tracking:",
                    error,
                );
            }
        };

        setupPresence();

        return () => {
            isMounted = false;
        };
    }, []);

    return null;
}

export default PresenceTracker;
