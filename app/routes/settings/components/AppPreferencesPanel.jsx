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

import {
    IconNotebook,
    IconSettings,
    IconPalette,
    IconChecklist,
    IconShieldLock,
} from "@tabler/icons-react";

import { trackEvent } from "@/utils/analytics";
import PreferenceSection from "./PreferenceSection";
import TeamAvailabilityRow from "./TeamAvailabilityRow";

const EMPTY_OBJECT = {};

const THEME_OPTIONS = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "Auto", value: "auto" },
];

const STATS_PRIVACY_OPTIONS = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
];

export default function AppPreferencesPanel({ teams = [] }) {
    const { user, isDesktop } = useOutletContext();
    const fetcher = useFetcher();

    const prefStartingPage = user?.prefs?.startingPage || "/dashboard";
    const prefStatsPrivacy = user?.prefs?.statsPrivacy || "public";
    const prefDefaultAvailability =
        typeof user?.prefs?.defaultAvailability === "string"
            ? JSON.parse(user.prefs.defaultAvailability)
            : user?.prefs?.defaultAvailability || EMPTY_OBJECT;

    const [startingPage, setStartingPage] = useState(prefStartingPage);
    const [statsPrivacy, setStatsPrivacy] = useState(prefStatsPrivacy);
    const [defaultAvailability, setDefaultAvailability] = useState(
        prefDefaultAvailability,
    );
    const { colorScheme, setColorScheme } = useMantineColorScheme();

    // Sync local state with user prefs when they change
    const prefDefaultAvailabilityStr = JSON.stringify(prefDefaultAvailability);

    useEffect(() => {
        setStartingPage(prefStartingPage);
    }, [prefStartingPage]);

    useEffect(() => {
        setStatsPrivacy(prefStatsPrivacy);
    }, [prefStatsPrivacy]);

    useEffect(() => {
        setDefaultAvailability(prefDefaultAvailability);
    }, [prefDefaultAvailabilityStr]);

    const handlePreferenceChange = (key, value) => {
        fetcher.submit(
            {
                _action: "update-user-preferences",
                userId: user.$id,
                [key]: value,
            },
            { method: "post", action: "/settings" },
        );
    };

    const handleStartingPageChange = (value) => {
        setStartingPage(value);
        trackEvent("starting-page-preference-changed", { value });
        handlePreferenceChange("startingPage", value);
    };

    const handleStatsPrivacyChange = (value) => {
        setStatsPrivacy(value);
        trackEvent("stats-privacy-preference-changed", { value });
        handlePreferenceChange("statsPrivacy", value);
    };

    const handleDefaultAvailabilityChange = (teamId, value) => {
        const newPrefs = { ...defaultAvailability, [teamId]: value };
        setDefaultAvailability(newPrefs);
        trackEvent("default-availability-preference-changed", {
            teamId,
            value,
        });
        handlePreferenceChange("defaultAvailability", JSON.stringify(newPrefs));
    };

    const handleThemeChange = (value) => {
        setColorScheme(value);
        trackEvent("theme-preference-changed", { value });
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

    const isLoading = fetcher.state !== "idle";

    const content = (
        <Stack gap="lg">
            <PreferenceSection
                icon={IconPalette}
                label="Theme"
                description="Choose how the app looks to you."
            >
                <SegmentedControl
                    fullWidth
                    data={THEME_OPTIONS}
                    value={colorScheme}
                    onChange={handleThemeChange}
                    disabled={isLoading}
                    radius="md"
                    color="blue"
                    transitionDuration={300}
                    styles={{
                        label: { fontWeight: 600 },
                    }}
                />
            </PreferenceSection>

            <PreferenceSection
                icon={IconNotebook}
                label="Starting Page"
                description="Pick the default view for when you open the app."
            >
                <SegmentedControl
                    data-testid="starting-page-selector"
                    fullWidth
                    data={startingPageOptions}
                    value={startingPage}
                    onChange={handleStartingPageChange}
                    disabled={isLoading}
                    radius="md"
                    color="blue"
                    transitionDuration={300}
                    styles={{
                        label: {
                            padding: `${rem(4)} ${rem(12)}`,
                            fontWeight: 600,
                        },
                    }}
                />
            </PreferenceSection>

            <PreferenceSection
                icon={IconShieldLock}
                label="Stats Privacy"
                description="Control who can see your batting averages and performance charts. Note: Team managers and coaches can always see your stats."
            >
                <SegmentedControl
                    fullWidth
                    data={STATS_PRIVACY_OPTIONS}
                    value={statsPrivacy}
                    onChange={handleStatsPrivacyChange}
                    disabled={isLoading}
                    radius="md"
                    color="blue"
                    transitionDuration={300}
                    styles={{
                        label: { fontWeight: 600 },
                    }}
                />
            </PreferenceSection>

            <PreferenceSection
                icon={IconChecklist}
                label="Default Availability"
                description='Automatically set your status to "Attending" for new games on a per-team basis.'
                showDivider={false}
            >
                <Stack gap="sm">
                    {teams.map((team) => (
                        <TeamAvailabilityRow
                            key={team.$id}
                            team={team}
                            value={defaultAvailability[team.$id]}
                            disabled={isLoading}
                            onChange={(val) =>
                                handleDefaultAvailabilityChange(team.$id, val)
                            }
                        />
                    ))}
                    {teams.length === 0 && (
                        <Text size="xs" c="dimmed" ta="center">
                            You are not currently a member of any teams.
                        </Text>
                    )}
                </Stack>
            </PreferenceSection>

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
