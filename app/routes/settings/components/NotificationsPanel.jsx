/**
 * NotificationsPanel Component
 * Settings panel for managing push notification preferences
 */

import { useState, useEffect } from "react";
import {
    Stack,
    Text,
    Divider,
    Button,
    Switch,
    Group,
    Loader,
} from "@mantine/core";
import { showNotification } from "@/utils/showNotification";
import NotificationToggle from "@/components/NotificationToggle";
import { useNotifications } from "@/hooks/useNotifications";

function TeamNotificationRow({
    team,
    checkTeamSubscription,
    subscribeToTeam,
    unsubscribeFromTeam,
    isSubscribed,
}) {
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        // Add a small delay to ensure backend propagation if this mounts immediately after global toggle
        const check = async () => {
            if (isSubscribed) {
                // Small delay to allow backend consistency if we just enabled global
                await new Promise((r) => setTimeout(r, 500));
            }
            checkTeamSubscription(team.$id).then((isSubscribed) => {
                if (mounted) {
                    setChecked(isSubscribed);
                    setLoading(false);
                }
            });
        };
        check();
        return () => {
            mounted = false;
        };
    }, [team.$id, checkTeamSubscription, isSubscribed]);

    const handleChange = async (event) => {
        const isChecking = event.currentTarget.checked;
        setChecked(isChecking); // Optimistic update

        let success = false;
        if (isChecking) {
            success = await subscribeToTeam(team.$id);
        } else {
            success = await unsubscribeFromTeam(team.$id);
        }

        if (!success) {
            setChecked(!isChecking); // Revert on failure
            showNotification({
                variant: "error",
                title: "Error",
                message: `Failed to update settings for ${team.name}`,
            });
        }
    };

    if (loading) {
        return (
            <Group justify="space-between">
                <Text size="sm">{team.name}</Text>
                <Loader size="xs" />
            </Group>
        );
    }

    return (
        <Group justify="space-between">
            <Text size="sm">{team.name}</Text>
            <Switch checked={checked} onChange={handleChange} size="sm" />
        </Group>
    );
}

export default function NotificationsPanel({ teams = [] }) {
    const {
        isSubscribed,
        checkTeamSubscription,
        subscribeToTeam,
        unsubscribeFromTeam,
    } = useNotifications();

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

            {isSubscribed && teams.length > 0 && (
                <>
                    <Divider
                        label="Team Notifications"
                        labelPosition="center"
                    />
                    <Stack gap="xs">
                        {teams.map((team) => (
                            <TeamNotificationRow
                                key={team.$id}
                                team={team}
                                checkTeamSubscription={checkTeamSubscription}
                                subscribeToTeam={subscribeToTeam}
                                unsubscribeFromTeam={unsubscribeFromTeam}
                                isSubscribed={isSubscribed}
                            />
                        ))}
                    </Stack>
                </>
            )}

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
