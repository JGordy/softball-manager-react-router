import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigation, useFetchers } from "react-router";

import {
    Stack,
    Text,
    Button,
    Group,
    ThemeIcon,
    List,
    Image,
    Title,
    Box,
    Card,
} from "@mantine/core";
import { useOs } from "@mantine/hooks";
import {
    IconShare2,
    IconSquarePlus,
    IconDownload,
    IconCheck,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { isStandalone, isDev } from "@/utils/pwa";
import { trackEvent } from "@/utils/analytics";
import images from "@/constants/images";
import branding from "@/constants/branding";

const INSTALL_DRAWER_DISMISSED_KEY = "install_drawer_dismissed";
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export default function InstallAppDrawer({ os: osOverride } = {}) {
    const navigation = useNavigation();
    const fetchers = useFetchers();
    const hookOs = useOs();
    const os = osOverride || hookOs;
    const { isInstallable, promptInstall } = usePWAInstall();
    const [opened, setOpened] = useState(false);

    // Track if a submission occurred
    const wasSubmitting = useRef(false);

    // Check if any global navigation or fetcher is currently submitting
    const isSubmitting =
        navigation.state === "submitting" ||
        fetchers.some((f) => f.state === "submitting");

    // Check if everything is completely idle
    const isIdle =
        navigation.state === "idle" &&
        fetchers.every((f) => f.state === "idle");

    const checkAndOpenDrawer = useCallback(() => {
        if (isStandalone()) {
            return;
        }

        const dismissedTimestamp = localStorage.getItem(
            INSTALL_DRAWER_DISMISSED_KEY,
        );
        if (dismissedTimestamp) {
            const now = Date.now();
            if (now - parseInt(dismissedTimestamp, 10) < DISMISS_DURATION) {
                return;
            }
        }

        // On Android/Chrome, we need the event to have fired (isInstallable).
        // On iOS, we can always show instructions.
        // For development/testing, we allow bypassing the install check

        if (os !== "ios" && !isInstallable && !isDev()) {
            return;
        }

        setOpened(true);
        trackEvent("install_prompt_view", { os });
    }, [isInstallable, os]);

    useEffect(() => {
        if (isSubmitting) {
            wasSubmitting.current = true;
        }

        if (isIdle && wasSubmitting.current) {
            wasSubmitting.current = false;
            checkAndOpenDrawer();
        }
    }, [isSubmitting, isIdle, checkAndOpenDrawer]);

    const handleClose = () => {
        setOpened(false);
        localStorage.setItem(
            INSTALL_DRAWER_DISMISSED_KEY,
            Date.now().toString(),
        );
        trackEvent("install_prompt_dismissed", { os });
    };

    const handleInstall = async () => {
        trackEvent("install_prompt_click", { os });
        const outcome = await promptInstall();
        if (outcome === "accepted") {
            trackEvent("install_prompt_success", { os });
            handleClose();
        } else if (outcome === "dismissed") {
            handleClose();
        }
    };

    // For iOS, viewing the instructions is the closest we get to "success"
    useEffect(() => {
        if (opened && os === "ios") {
            trackEvent("install_instruction_view", { os });
        }
    }, [opened, os]);

    return (
        <DrawerContainer
            opened={opened}
            onClose={handleClose}
            title={null}
            size="lg"
        >
            <Stack align="center" gap="md">
                <Stack align="center" gap={4}>
                    <Image
                        src={images.brandIcon192}
                        w={64}
                        h={64}
                        radius="md"
                    />
                    <Title order={3} size="h4" mt="xs">
                        Get the {branding.name} App
                    </Title>
                    <Text c="dimmed" size="sm" ta="center">
                        Enable push notifications and keep your team in sync.
                    </Text>
                </Stack>

                <Box w="100%" px="sm">
                    <List
                        spacing="xs"
                        size="sm"
                        center
                        icon={
                            <ThemeIcon color="green" size={20} radius="xl">
                                <IconCheck size={12} />
                            </ThemeIcon>
                        }
                    >
                        <List.Item>Instant game & lineup updates</List.Item>
                        <List.Item>Easier team management</List.Item>
                        <List.Item>Native app experience</List.Item>
                    </List>
                </Box>

                {os === "ios" ? (
                    <Card withBorder radius="md" padding="sm" w="100%">
                        <Stack gap="xs">
                            <Group gap="xs">
                                <ThemeIcon
                                    variant="transparent"
                                    color="blue"
                                    size="sm"
                                >
                                    <IconShare2 size={18} />
                                </ThemeIcon>
                                <Text size="sm">
                                    Tap <b>Share</b> in the toolbar
                                </Text>
                            </Group>
                            <Group gap="xs">
                                <ThemeIcon
                                    variant="transparent"
                                    color="gray"
                                    size="sm"
                                >
                                    <IconSquarePlus size={18} />
                                </ThemeIcon>
                                <Text size="sm">
                                    Select <b>Add to Home Screen</b>
                                </Text>
                            </Group>
                        </Stack>
                    </Card>
                ) : (
                    <Button
                        fullWidth
                        size="md"
                        color="blue"
                        leftSection={<IconDownload size={18} />}
                        onClick={handleInstall}
                    >
                        Install Now
                    </Button>
                )}

                <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={handleClose}
                >
                    Maybe later
                </Button>
            </Stack>
        </DrawerContainer>
    );
}
