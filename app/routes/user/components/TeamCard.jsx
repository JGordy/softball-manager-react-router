import { Link } from "react-router";

import {
    Card,
    Divider,
    Text,
    Group,
    ThemeIcon,
    useComputedColorScheme,
} from "@mantine/core";

import { IconCalendar, IconFriends } from "@tabler/icons-react";

import { adjustColorBasedOnDarkness } from "@/utils/adjustHexColor";

export default function TeamCard({ team }) {
    const computedColorScheme = useComputedColorScheme("light");

    const { primaryColor } = team;
    const adjustedColor = adjustColorBasedOnDarkness(
        primaryColor,
        computedColorScheme === "light" ? 100 : 50,
    );

    const getSeasonStatus = () => {
        const { seasons } = team;
        if (!seasons || !seasons.length) {
            return "No upcoming seasons";
        }

        // Create a shallow copy and sort seasons by start date, ascending
        const sortedSeasons = [...seasons].sort(
            (a, b) => new Date(a.startDate) - new Date(b.startDate),
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare date part only

        // First, check for a season in progress
        const currentSeason = sortedSeasons.find((season) => {
            const startDate = new Date(season.startDate);
            const endDate = new Date(season.endDate);
            return today >= startDate && today <= endDate;
        });

        if (currentSeason) {
            return "Season in progress";
        }

        // If no current season, find the next upcoming season
        const upcomingSeason = sortedSeasons.find(
            (season) => new Date(season.startDate) > today,
        );

        if (upcomingSeason) {
            const startDate = new Date(upcomingSeason.startDate);
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

            if (startDate < oneMonthFromNow) {
                const timeDiff = startDate.getTime() - today.getTime();
                const daysUntilStart = Math.ceil(timeDiff / (1000 * 3600 * 24));
                const daysUntilText = `${daysUntilStart} day${daysUntilStart !== 1 ? "s" : ""}`;
                const daysUntil = (
                    <Text span fw={700} c="green">
                        {daysUntilText}
                    </Text>
                );
                return <>Season starts in {daysUntil}</>;
            } else {
                const month = startDate.getMonth() + 1;
                const date = startDate.getDate();
                return `Season starts ${month}/${date}`;
            }
        }

        // All seasons are in the past
        return "No upcoming seasons";
    };

    const iconProps = {
        variant: "gradient",
        gradient: { from: primaryColor, to: adjustedColor, deg: 155 },
        size: "md",
        // autoContrast: true, // Only works when not using gradients?
    };

    return (
        <Link to={`/team/${team.$id}`}>
            <Card
                className="team-card"
                key={team.$id}
                padding="lg"
                shadow="sm"
                style={{ cursor: "pointer" }}
                radius="md"
                withBorder
            >
                <Group justify="space-between">
                    <Text weight={500} size="lg">
                        {team.name}
                    </Text>
                    <Text size="md" c="dimmed">
                        {team.leagueName}
                    </Text>
                </Group>

                <Group mt="sm" gap="xs">
                    <Group gap="xs">
                        <ThemeIcon {...iconProps}>
                            <IconCalendar size={16} />
                        </ThemeIcon>
                        <Text size="md">{getSeasonStatus()}</Text>
                    </Group>
                    {team.genderMix && (
                        <Group gap="xs">
                            <ThemeIcon {...iconProps}>
                                <IconFriends size={18} />
                            </ThemeIcon>
                            <Text size="md">{team.genderMix}</Text>
                        </Group>
                    )}
                </Group>
            </Card>
        </Link>
    );
}
