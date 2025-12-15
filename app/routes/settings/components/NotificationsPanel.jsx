/**
 * NotificationsPanel Component
 * Settings panel for managing push notification preferences
 */

import { Stack, Text, Divider, Button } from "@mantine/core";
import { showNotification } from "@/utils/showNotification";
import NotificationToggle from "@/components/NotificationToggle";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsPanel() {
    const { isSubscribed } = useNotifications();

    // Handler for sending a test notification
    const handleSendTestNotification = async () => {
        try {
            const response = await fetch("/api/test-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (!response.ok) {
                showNotification({
                    variant: "error",
                    title: "Failed to Send Test Notification",
                    message: data.error || "Unknown error.",
                });
            }
            // If success, do not show a notification here; the push notification itself will appear.
        } catch (error) {
            showNotification({
                variant: "error",
                title: "Error",
                message: error.message || "Failed to send test notification.",
            });
        }
    };

    return (
        <Stack gap="md">
            <Text size="sm" c="dimmed">
                Manage your push notification preferences. When enabled, you'll
                receive notifications for game reminders, lineup updates, and
                team announcements.
            </Text>

            <Divider />

            <NotificationToggle />

            <Button
                onClick={handleSendTestNotification}
                variant="outline"
                color="blue"
                mt="xs"
                disabled={!isSubscribed}
            >
                Send Test Notification
            </Button>

            <Divider />

            <Text size="xs" c="dimmed">
                Note: Push notifications require a modern browser and may not
                work in all environments. Notifications are sent to this device
                only.
            </Text>
        </Stack>
    );
}
