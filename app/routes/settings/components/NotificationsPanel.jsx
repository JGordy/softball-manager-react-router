/**
 * NotificationsPanel Component
 * Settings panel for managing push notification preferences
 */

import { Stack, Text, Divider } from "@mantine/core";
import NotificationToggle from "@/components/NotificationToggle";

export default function NotificationsPanel() {
    return (
        <Stack gap="md">
            <Text size="sm" c="dimmed">
                Manage your push notification preferences. When enabled, you'll
                receive notifications for game reminders, lineup updates, and
                team announcements.
            </Text>

            <Divider />

            <NotificationToggle />

            <Divider />

            <Text size="xs" c="dimmed">
                Note: Push notifications require a modern browser and may not
                work in all environments. Notifications are sent to this device
                only.
            </Text>
        </Stack>
    );
}
