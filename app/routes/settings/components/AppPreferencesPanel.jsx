import { useState, useEffect } from "react";
import { useFetcher, useOutletContext } from "react-router";
import {
    Card,
    Divider,
    Group,
    SegmentedControl,
    Stack,
    Text,
    Title,
    Box,
    rem,
    useMantineColorScheme,
} from "@mantine/core";

import { IconSettings } from "@tabler/icons-react";

export default function AppPreferencesPanel() {
    const { user, isDesktop } = useOutletContext();
    const fetcher = useFetcher();

    const prefStartingPage = user?.prefs?.startingPage || "/dashboard";

    const [startingPage, setStartingPage] = useState(prefStartingPage);
    const { colorScheme, setColorScheme } = useMantineColorScheme();

    // Sync local state with user prefs when they change
    useEffect(() => {
        setStartingPage(prefStartingPage);
    }, [prefStartingPage]);

    const handleStartingPageChange = (value) => {
        setStartingPage(value);
        fetcher.submit(
            {
                _action: "update-user-preferences",
                userId: user.$id,
                startingPage: value,
            },
            { method: "post", action: "/settings" },
        );
    };

    const handleThemeChange = (value) => {
        setColorScheme(value);
        // Save to cookie and Appwrite prefs
        const isSecureContext =
            typeof window !== "undefined" &&
            window.location &&
            window.location.protocol === "https:";

        const cookieAttributes = ["path=/", "max-age=31536000", "SameSite=Lax"];

        if (isSecureContext) {
            cookieAttributes.push("Secure");
        }

        document.cookie = `themePreference=${value}; ${cookieAttributes.join("; ")}`;

        fetcher.submit(
            {
                _action: "update-user-preferences",
                userId: user.$id,
                themePreference: value, // auto, light, dark
            },
            { method: "post", action: "/settings" },
        );
    };

    const startingPageOptions = [
        { label: "Dashboard", value: "/dashboard" },
        { label: "Events", value: "/events" },
        { label: "Profile", value: `/user/${user.$id}` },
    ];

    const themeOptions = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "Auto", value: "auto" },
    ];

    const isLoading = fetcher.state !== "idle";

    const content = (
        <Stack gap="lg">
            <Box px="xs">
                <Text size="sm" fw={500} mb={4}>
                    Theme
                </Text>
                <Text size="xs" c="dimmed" mb="md">
                    Choose how the app looks to you.
                </Text>
                <SegmentedControl
                    fullWidth
                    data={themeOptions}
                    value={colorScheme}
                    onChange={handleThemeChange}
                    disabled={isLoading}
                    radius="md"
                    color="lime.4"
                    transitionDuration={300}
                    styles={{
                        label: {
                            fontWeight: 600,
                        },
                        // We'll use CSS variables or Mantine theme for text color consistency
                    }}
                />
            </Box>

            <Divider variant="dashed" />

            <Box px="xs">
                <Text size="sm" fw={500} mb={4}>
                    Starting Page
                </Text>
                <Text size="xs" c="dimmed" mb="md">
                    Pick the default view for when you open the app.
                </Text>
                <SegmentedControl
                    data-testid="starting-page-selector"
                    fullWidth
                    data={startingPageOptions}
                    value={startingPage}
                    onChange={handleStartingPageChange}
                    disabled={isLoading}
                    radius="md"
                    color="lime.4"
                    transitionDuration={300}
                    styles={{
                        label: {
                            padding: `${rem(4)} ${rem(12)}`,
                            fontWeight: 600,
                        },
                    }}
                />
            </Box>

            {fetcher.data?.success && (
                <Text size="xs" c="green" ta="center">
                    Preference saved!
                </Text>
            )}
        </Stack>
    );

    if (!isDesktop) {
        return <Box py="sm">{content}</Box>;
    }

    return (
        <Card withBorder radius="lg" p="xl" shadow="sm">
            <Group mb="md">
                <IconSettings size={24} color="var(--mantine-color-blue-5)" />
                <Title order={3}>App Preferences</Title>
            </Group>
            <Divider mb="xl" />
            {content}
        </Card>
    );
}
