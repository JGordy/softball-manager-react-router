/**
 * API route for managing push notification targets
 * Handles creating and deleting push targets for the current user
 */

import {
    createPushTarget,
    deletePushTarget,
    getPushTarget,
} from "@/actions/notifications";

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
        const target = await getPushTarget({ request, targetId });

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

            const target = await createPushTarget({
                request,
                fcmToken,
                providerId,
            });

            return Response.json({
                success: true,
                targetId: target.$id,
            });
        }

        if (method === "DELETE") {
            const { targetId } = await request.json();

            await deletePushTarget({ request, targetId });

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
