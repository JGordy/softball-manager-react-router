import { Link } from "react-router";

import {
    Card,
    Divider,
    Text,
    Group,
    ThemeIcon,
    useComputedColorScheme,
} from '@mantine/core';

import {
    IconCalendar,
    IconFriends,
} from '@tabler/icons-react';

import { adjustColorBasedOnDarkness } from '@/utils/adjustHexColor';

export default function TeamCard({ team }) {

    const computedColorScheme = useComputedColorScheme('light');

    const { primaryColor } = team;
    const adjustedColor = adjustColorBasedOnDarkness(primaryColor, computedColorScheme === 'light' ? 100 : 50);

    const getSeasonStatus = () => {
        const { seasons } = team;
        if (!seasons || seasons.length === 0) {
            return 'No upcoming seasons';
        }

        const today = new Date();
        const oneMonthFromNow = new Date(today);
        oneMonthFromNow.setMonth(today.getMonth() + 1);

        for (const season of seasons) {
            const startDate = new Date(season.startDate);
            const endDate = new Date(season.endDate);

            if (startDate <= today && today <= endDate) {
                return 'Season in progress';
            }

            if (startDate > today && startDate <= oneMonthFromNow) {
                const timeDiff = startDate.getTime() - today.getTime();
                const daysUntilStart = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days

                const daysUntilText = `${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;

                const daysUntil = (
                    <Text span fw={700} c="green">
                        {daysUntilText}
                    </Text>
                );

                return (
                    <>
                        Season starts in {daysUntil}
                    </>
                );
            }
        }

        if (seasons.length) {
            const season = seasons[0];
            const startDate = new Date(season.startDate);
            const month = startDate?.getMonth?.() + 1;
            const date = startDate?.getDate?.();
            return `Season starts ${month}/${date}`;
        }
    }

    const iconProps = {
        variant: 'gradient',
        gradient: { from: primaryColor, to: adjustedColor, deg: 155 },
        size: 'md',
        // autoContrast: true, // Only works when not using gradients?
    };

    return (
        <Link to={`/team/${team.$id}`}>
            <Card
                key={team.$id}
                padding="lg"
                shadow="sm"
                style={{ cursor: 'pointer' }}
                radius="xl"
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

                <Divider my="sm" />

                <Group mb="xs" gap="xs">
                    <Group gap="xs">
                        <ThemeIcon {...iconProps}>
                            <IconCalendar size={16} />
                        </ThemeIcon>
                        <Text size="md">
                            {getSeasonStatus()}
                        </Text>
                    </Group>
                    {team.genderMix && (
                        <Group gap="xs">
                            <ThemeIcon {...iconProps}>
                                <IconFriends size={18} />
                            </ThemeIcon>
                            <Text size="md">
                                {team.genderMix}
                            </Text>
                        </Group>
                    )}
                </Group>
            </Card>
        </Link>
    );
};