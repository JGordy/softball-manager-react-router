/**
 * Test Notification API Route
 * POST /api/test-notification
 *
 * Use this to test sending push notifications.
 * This endpoint is secured and only allows sending a test notification to the authenticated user.
 */

import { userContext } from "@/contexts/router";
import { sendPushNotification } from "@/actions/notifications";

export async function action({ request, context }) {
    try {
        // Get the current user
        const user = context.get(userContext);

        if (!user) {
            return Response.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const url = new URL(request.url);
        const origin = url.origin;

        // Send a test notification to the current user
        const result = await sendPushNotification({
            userIds: [user.$id],
            title: "🎉 Test Notification",
            body: "Push notifications are working! This is a test message.",
            url: `/user/${user.$id}`,
            origin,
        });

        return Response.json(result);
    } catch (error) {
        console.error("Test notification error:", error);
        return Response.json(
            { error: error.message || "Failed to send test notification" },
            { status: 500 },
        );
    }
}
