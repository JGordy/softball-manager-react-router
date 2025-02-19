import { Link } from "react-router";

import {
    Card,
    Center,
    Divider,
    Text,
    Group,
    ThemeIcon,
    useComputedColorScheme,
} from '@mantine/core';

import {
    IconCalendar,
    IconCurrencyDollar,
    IconFriends,
    IconMapPin,
} from '@tabler/icons-react';

import { adjustColorBasedOnDarkness } from '@/utils/adjustHexColor';

export default function TeamCard({ team, userId, season }) {

    const computedColorScheme = useComputedColorScheme('light');

    const { primaryColor } = team;
    const adjustedColor = adjustColorBasedOnDarkness(primaryColor, computedColorScheme === 'light' ? 100 : 50);

    const latestSeasonDates = season?.startDate ? `${new Date(season.startDate).toLocaleDateString()} - ${new Date(season.endDate).toLocaleDateString()}` : 'No season data listed';

    const iconProps = {
        variant: 'gradient',
        gradient: { from: primaryColor, to: adjustedColor, deg: 155 },
        size: 'md',
        // autoContrast: true, // Only works when not using gradients?
    };

    return (
        <Link to={`/user/${userId}/team/${team.$id}`}>
            <Card
                key={team.$id}
                padding="lg"
                shadow="sm"
                style={{ cursor: 'pointer' }}
                radius="xl"
                withBorder
            >
                <Center>
                    <Text weight={500} size="lg">
                        {team.name}
                    </Text>
                </Center>

                <Divider my="sm" />

                <Group mb="xs" gap="xs">
                    <Group gap="xs">
                        <ThemeIcon {...iconProps}>
                            <IconCalendar size={16} />
                        </ThemeIcon>
                        <Text size="md">
                            {latestSeasonDates}
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <ThemeIcon {...iconProps}>
                            <IconMapPin size={16} />
                        </ThemeIcon>
                        <Text size="md">
                            {season?.location || "Location not specified"}
                        </Text>
                    </Group>
                </Group>

                <Group gap="lg">
                    <Group gap="xs">
                        <ThemeIcon {...iconProps}>
                            <IconFriends size={18} />
                        </ThemeIcon>
                        <Text size="md">
                            {team.genderMix || 'Not Specified'}
                        </Text>
                    </Group>

                    <Group gap="xs">
                        <ThemeIcon {...iconProps}>
                            <IconCurrencyDollar size={18} />
                        </ThemeIcon>
                        <Text size="md">
                            {team.signUpFee || 'Not Specified'}
                        </Text>
                    </Group>
                </Group>

                <Text size="md" c="dimmed" mt="sm">
                    {team.leagueName}
                </Text>

                {/* <Text size="sm" c="dimmed" mb="xs">
                    Game Days: {team.gameDays}
                </Text> */}
            </Card>
        </Link>
    );
};