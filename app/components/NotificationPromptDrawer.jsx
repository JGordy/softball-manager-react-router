import { useState, useEffect } from "react";

import { Stack, Text, Button, Group, ThemeIcon } from "@mantine/core";
import { useOs } from "@mantine/hooks";

import { IconBell, IconShare2, IconSquarePlus } from "@tabler/icons-react";

import { useNotifications } from "@/hooks/useNotifications";
import { isStandalone } from "@/utils/pwa";
import { trackEvent } from "@/utils/analytics";

import DrawerContainer from "./DrawerContainer";

const STORAGE_KEY = "notification_drawer_dismissed";
const INTERACTION_DELAY = 10000; // 10 seconds

export default function NotificationPromptDrawer() {
    const [opened, setOpened] = useState(false);
    const [view, setView] = useState("initial"); // 'initial' | 'instruction'

    const { isSubscribed, subscribe, isSupported } = useNotifications();

    const os = useOs();

    useEffect(() => {
        // Don't show if already subscribed or not supported
        if (isSubscribed || !isSupported) return;

        // Don't show if previously dismissed
        if (localStorage.getItem(STORAGE_KEY)) return;

        // Show after delay
        const timer = setTimeout(() => {
            setOpened(true);
        }, INTERACTION_DELAY);

        return () => clearTimeout(timer);
    }, [isSubscribed, isSupported]);

    const handleDismiss = () => {
        if (view === "instruction") {
            trackEvent("notifications-instruction-dismiss", {
                os,
                location: "drawer",
            });
        }
        setOpened(false);
        localStorage.setItem(STORAGE_KEY, "true");
    };

    const handleEnable = async () => {
        // Special flow for iOS not in standalone mode
        if (os === "ios" && !isStandalone()) {
            trackEvent("notifications-instruction-impression", {
                os,
                location: "drawer",
            });
            setView("instruction");
        } else {
            // Standard flow
            try {
                await subscribe({ location: "drawer" });
                handleDismiss();
            } catch (error) {
                console.error("Failed to subscribe:", error);
                // Optionally show error toast here, but relying on global error handling or UI feedback might be better
            }
        }
    };

    const isIosInstruction = view === "instruction";

    return (
        <DrawerContainer
            opened={opened}
            onClose={handleDismiss}
            title={
                isIosInstruction
                    ? "Install App to Enable"
                    : "Don't Miss a Play!"
            }
            size="lg"
        >
            <Stack gap="lg" pb="md" align="center">
                {!isIosInstruction ? (
                    <>
                        <ThemeIcon
                            size={80}
                            radius={26}
                            variant="gradient"
                            gradient={{ from: "blue", to: "cyan" }}
                            style={{
                                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                            }}
                        >
                            <IconBell size={40} style={{ margin: "auto" }} />
                        </ThemeIcon>

                        <Stack gap={4} align="center">
                            <Text ta="center" size="xl" fw={700}>
                                Don't Miss a Play!
                            </Text>
                            <Text
                                ta="center"
                                c="dimmed"
                                style={{ maxWidth: 280, lineHeight: 1.5 }}
                            >
                                Get real-time updates for games, lineups, and
                                team announcements directly to your device.
                            </Text>
                        </Stack>

                        <Stack w="100%" gap="xs">
                            <Button
                                onClick={handleEnable}
                                size="lg"
                                radius="md"
                                fullWidth
                                variant="gradient"
                                gradient={{ from: "blue", to: "cyan" }}
                                styles={{
                                    root: {
                                        transition: "transform 0.2s ease",
                                        "&:active": {
                                            transform: "scale(0.98)",
                                        },
                                    },
                                }}
                            >
                                Enable Notifications
                            </Button>
                            <Button
                                variant="subtle"
                                onClick={handleDismiss}
                                size="md"
                                radius="md"
                                color="gray"
                                fullWidth
                            >
                                Maybe Later
                            </Button>
                        </Stack>
                    </>
                ) : (
                    <>
                        <Stack gap={2} align="center">
                            <Text size="lg" fw={600} ta="center">
                                Install to Enable
                            </Text>
                            <Text size="sm" c="dimmed" ta="center" maw={300}>
                                To receive notifications on iPhone, you must add
                                this app to your home screen.
                            </Text>
                        </Stack>

                        <Stack
                            gap="md"
                            w="100%"
                            p="md"
                            style={{ borderRadius: 12 }}
                        >
                            <Group align="center" wrap="nowrap">
                                <ThemeIcon
                                    variant="white"
                                    color="gray"
                                    radius="md"
                                    size="lg"
                                >
                                    <IconShare2 size={20} />
                                </ThemeIcon>
                                <Text size="sm">
                                    1. Tap the <b>Share</b> button in the menu
                                    bar.
                                </Text>
                            </Group>
                            <Group align="center" wrap="nowrap">
                                <ThemeIcon
                                    variant="white"
                                    color="gray"
                                    radius="md"
                                    size="lg"
                                >
                                    <IconSquarePlus size={20} />
                                </ThemeIcon>
                                <Text size="sm">
                                    2. Scroll down and tap{" "}
                                    <b>Add to Home Screen</b>.
                                </Text>
                            </Group>
                        </Stack>

                        <Button
                            onClick={handleDismiss}
                            size="md"
                            radius="md"
                            fullWidth
                            mt="sm"
                            variant="gradient"
                            gradient={{ from: "blue", to: "cyan" }}
                            styles={{
                                root: {
                                    transition: "transform 0.2s ease",
                                    "&:active": {
                                        transform: "scale(0.98)",
                                    },
                                },
                            }}
                        >
                            Got it
                        </Button>
                    </>
                )}
            </Stack>
        </DrawerContainer>
    );
}
