/**
 * API route for managing push notification targets
 * Handles creating and deleting push targets for the current user
 */

import {
    createPushTarget,
    deletePushTarget,
    getPushTarget,
    subscribeToAllTeams,
} from "@/actions/notifications";

import { createSessionClient } from "@/utils/appwrite/server";

/**
 * POST: Create a new push target
 * DELETE: Remove an existing push target
 */

export async function loader({ request }) {
    // GET: Verify if a push target exists for the current user and targetId
    const url = new URL(request.url);
    const targetId = url.searchParams.get("targetId");

    if (!targetId) {
        return Response.json({ error: "Missing targetId" }, { status: 400 });
    }
    try {
        const sessionClient = await createSessionClient(request);
        const target = await getPushTarget({ client: sessionClient, targetId });

        if (!target) {
            return Response.json({ error: "Not found" }, { status: 404 });
        }
        return Response.json({ success: true, target });
    } catch (error) {
        return Response.json(
            { error: error.message || "Failed to get push target" },
            { status: 500 },
        );
    }
}

export async function action({ request }) {
    const method = request.method;
    try {
        if (method === "POST") {
            const { fcmToken, providerId } = await request.json();
            const sessionClient = await createSessionClient(request);

            const target = await createPushTarget({
                client: sessionClient,
                fcmToken,
                providerId,
            });

            // Auto-subscribe to all teams
            // We do this in the background (fire and forget) or await it?
            // Awaiting it ensures consistency but slows down the UI.
            // Since "Enable Notifications" is a heavy action, awaiting is fine.
            try {
                await subscribeToAllTeams({
                    client: sessionClient,
                    targetId: target.$id,
                });
            } catch (subError) {
                console.error("Auto-subscribe failed:", subError);
                // Don't fail the request, just log it
            }

            return Response.json({
                success: true,
                targetId: target.$id,
            });
        }

        if (method === "DELETE") {
            const { targetId } = await request.json();
            const sessionClient = await createSessionClient(request);

            await deletePushTarget({ client: sessionClient, targetId });

            return Response.json({ success: true });
        }

        return Response.json({ error: "Method not allowed" }, { status: 405 });
    } catch (error) {
        console.error("Push target error:", error);
        return Response.json(
            { error: error.message || "Failed to manage push target" },
            { status: 500 },
        );
    }
}
