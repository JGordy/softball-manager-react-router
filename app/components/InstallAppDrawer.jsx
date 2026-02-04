import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";

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
import { isStandalone } from "@/utils/pwa";
import { trackEvent } from "@/utils/analytics";
import images from "@/constants/images";
import branding from "@/constants/branding";

const INSTALL_DRAWER_DISMISSED_KEY = "install_drawer_dismissed";
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export default function InstallAppDrawer() {
    const navigation = useNavigation();
    const os = useOs();
    const { isInstallable, promptInstall } = usePWAInstall();
    const [opened, setOpened] = useState(false);

    // Track previous navigation state
    const prevNavState = useRef(navigation.state);

    useEffect(() => {
        const isActionSequenceComplete =
            navigation.state === "idle" &&
            (prevNavState.current === "submitting" ||
                prevNavState.current === "loading");

        if (isActionSequenceComplete) {
            checkAndOpenDrawer();
        }
        prevNavState.current = navigation.state;
    }, [navigation.state]);

    const checkAndOpenDrawer = () => {
        if (isStandalone()) return;

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
        const isDev = import.meta.env.DEV;
        if (os !== "ios" && !isInstallable && !isDev) {
            return;
        }

        setOpened(true);
        trackEvent("install_prompt_view", { os });
    };

    const handleClose = () => {
        setOpened(false);
        localStorage.setItem(
            INSTALL_DRAWER_DISMISSED_KEY,
            Date.now().toString(),
        );
        trackEvent("install_prompt_dismissed");
    };

    const handleInstall = async () => {
        trackEvent("install_prompt_click", { os });
        const outcome = await promptInstall();
        if (outcome === "accepted") {
            trackEvent("install_prompt_success", { platform: "android" });
            handleClose();
        }
    };

    // For iOS, viewing the instructions is the closest we get to "success"
    useEffect(() => {
        if (opened && os === "ios") {
            trackEvent("install_instruction_view", { platform: "ios" });
        }
    }, [opened, os]);

    return (
        <DrawerContainer
            opened={opened}
            onClose={handleClose}
            title={null}
            showCloseButton={true}
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
