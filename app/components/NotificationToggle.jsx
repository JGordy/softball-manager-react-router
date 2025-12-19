/**
 * NotificationToggle Component
 * A simple toggle button for enabling/disabling push notifications
 * Add this to the user profile or settings page to test notifications
 */

import { Button, Group, Text, Alert, Stack } from "@mantine/core";
import { IconBell, IconBellOff, IconAlertCircle } from "@tabler/icons-react";
import { useNotifications } from "@/hooks/useNotifications";
import { trackEvent } from "@/utils/analytics";

export default function NotificationToggle() {
    const {
        isSupported,
        isSubscribed,
        isLoading,
        isDenied,
        error,
        toggleSubscription,
        clearError,
    } = useNotifications();

    const handleToggleSubscription = () => {
        trackEvent("notifications-toggle-click", {
            isSubscribed,
        });
        toggleSubscription();
    };

    // Browser doesn't support push notifications
    if (!isSupported) {
        return (
            <Alert
                icon={<IconAlertCircle size={16} />}
                title="Not Supported"
                color="gray"
            >
                Push notifications are not supported in this browser.
            </Alert>
        );
    }

    // User has denied notification permission
    if (isDenied) {
        return (
            <Alert
                icon={<IconAlertCircle size={16} />}
                title="Notifications Blocked"
                color="orange"
            >
                <Text size="sm">
                    You have blocked notifications. To enable them, update your
                    browser settings for this site.
                </Text>
            </Alert>
        );
    }

    return (
        <Stack gap="sm">
            {error && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Error"
                    color="red"
                    withCloseButton
                    onClose={clearError}
                >
                    {error}
                </Alert>
            )}

            <Group justify="space-between" align="center">
                <Group gap="xs">
                    {isSubscribed ? (
                        <IconBell size={20} color="green" />
                    ) : (
                        <IconBellOff size={20} color="gray" />
                    )}
                    <Text>Push Notifications</Text>
                </Group>

                <Button
                    variant={isSubscribed ? "light" : "filled"}
                    color={isSubscribed ? "red" : "blue"}
                    loading={isLoading}
                    onClick={handleToggleSubscription}
                    size="sm"
                >
                    {isSubscribed ? "Disable" : "Enable"}
                </Button>
            </Group>

            <Text size="xs" c="dimmed">
                {isSubscribed
                    ? "You will receive game reminders, lineup updates, and team announcements."
                    : "Enable to receive game reminders and team updates."}
            </Text>
        </Stack>
    );
}
