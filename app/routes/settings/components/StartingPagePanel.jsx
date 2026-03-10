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
    Center,
    Box,
    rem,
} from "@mantine/core";
import {
    IconBallBaseball,
    IconCalendarEvent,
    IconUserCircle,
    IconSettings,
} from "@tabler/icons-react";

export default function StartingPagePanel() {
    const { user, isDesktop } = useOutletContext();
    const fetcher = useFetcher();

    const prefStartingPage = user?.prefs?.startingPage || "/dashboard";
    const [startingPage, setStartingPage] = useState(prefStartingPage);

    // Sync local state with user prefs when they change (e.g. after revalidation)
    useEffect(() => {
        setStartingPage(prefStartingPage);
    }, [prefStartingPage]);

    const options = [
        {
            value: "/dashboard",
            label: (
                <Center gap="xs">
                    <IconBallBaseball
                        size={16}
                        color={
                            startingPage === "/dashboard"
                                ? "var(--mantine-color-lime-filled)"
                                : "inherit"
                        }
                    />
                    <Text
                        size="sm"
                        fw={startingPage === "/dashboard" ? 600 : 500}
                        c={startingPage === "/dashboard" ? "lime.6" : "dimmed"}
                    >
                        Dashboard
                    </Text>
                </Center>
            ),
        },
        {
            value: "/events",
            label: (
                <Center gap="xs">
                    <IconCalendarEvent
                        size={16}
                        color={
                            startingPage === "/events"
                                ? "var(--mantine-color-lime-filled)"
                                : "inherit"
                        }
                    />
                    <Text
                        size="sm"
                        fw={startingPage === "/events" ? 600 : 500}
                        c={startingPage === "/events" ? "lime.6" : "dimmed"}
                    >
                        Events
                    </Text>
                </Center>
            ),
        },
        {
            value: `/user/${user.$id}`,
            label: (
                <Center gap="xs">
                    <IconUserCircle
                        size={16}
                        color={
                            startingPage === `/user/${user.$id}`
                                ? "var(--mantine-color-lime-filled)"
                                : "inherit"
                        }
                    />
                    <Text
                        size="sm"
                        fw={startingPage === `/user/${user.$id}` ? 600 : 500}
                        c={
                            startingPage === `/user/${user.$id}`
                                ? "lime.6"
                                : "dimmed"
                        }
                    >
                        Profile
                    </Text>
                </Center>
            ),
        },
    ];

    const handleChange = (value) => {
        setStartingPage(value);
        fetcher.submit(
            {
                _action: "update-starting-page",
                userId: user.$id,
                startingPage: value,
            },
            { method: "post", action: "/settings" },
        );
    };

    const isLoading = fetcher.state !== "idle";

    const content = (
        <Stack gap="md">
            <Box px="xs">
                <Text size="sm" fw={500} mb={4}>
                    Starting Page
                </Text>
                <Text size="xs" c="dimmed">
                    Pick the default view for when you open the app.
                </Text>
            </Box>

            <SegmentedControl
                data-testid="starting-page-selector"
                fullWidth
                data={options}
                value={startingPage}
                onChange={handleChange}
                disabled={isLoading}
                radius="xl"
                transitionDuration={300}
                withItemsBorders={false}
                bg="transparent"
                styles={{
                    root: {
                        backgroundColor: "transparent",
                    },
                    indicator: {
                        backgroundColor: "var(--mantine-color-lime-light)",
                        border: "1px solid var(--mantine-color-lime-filled)",
                    },
                    control: {
                        border: "0 !important",
                    },
                    label: {
                        padding: `${rem(4)} ${rem(12)}`,
                    },
                }}
            />

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
