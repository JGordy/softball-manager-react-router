/**
 * Test Notification API Route
 * POST /api/test-notification
 *
 * Use this to test sending push notifications.
 * This endpoint is secured and only allows sending a test notification to the authenticated user.
 */

import { createSessionClient } from "@/utils/appwrite/server";
import { sendPushNotification } from "@/actions/notifications";

export async function action({ request }) {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
        return Response.json(
            { error: "This endpoint is only available in development" },
            { status: 403 },
        );
    }

    try {
        // Get the current user
        const { account } = await createSessionClient(request);
        const user = await account.get();

        if (!user) {
            return Response.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        // Send a test notification to the current user
        const result = await sendPushNotification({
            userIds: [user.$id],
            title: "🎉 Test Notification",
            body: "Push notifications are working! This is a test message.",
            url: `/user/${user.$id}`,
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
