import { Link } from "react-router";

import {
    Card,
    Center,
    Divider,
    Text,
    Group,
    ThemeIcon,
} from '@mantine/core';

import {
    // IconCalendar,
    IconCurrencyDollar,
    IconFriends,
    // IconMapPin,
} from '@tabler/icons-react';

export default function TeamCard({ team, userId }) {

    return (
        <Link to={`/user/${userId}/teams/${team.$id}`}>
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

                {/* <Group mb="xs">
                    <Group>
                        <ThemeIcon variant="light" color="green">
                            <IconCalendar size={16} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                            {new Date(team.seasonStartDate).toLocaleDateString()} - {new Date(team.seasonEndDate).toLocaleDateString()}
                        </Text>
                    </Group>

                    <Group>
                        <ThemeIcon variant="light" color="blue">
                            <IconMapPin size={16} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                            {team.location || "Location not specified"}
                        </Text>
                    </Group>
                </Group> */}

                <Group gap="lg">
                    <Group gap="xs">
                        <ThemeIcon variant="light" size="md">
                            <IconFriends size={18} />
                        </ThemeIcon>
                        <Text size="md">
                            {team.genderMix}
                        </Text>
                    </Group>

                    <Group gap="xs">
                        <ThemeIcon variant="light" size="md">
                            <IconCurrencyDollar size={18} />
                        </ThemeIcon>
                        <Text size="md">
                            {team.signUpFee}
                        </Text>
                    </Group>
                </Group>

                <Text size="md" c="dimmed" mt="sm">
                    {team.leagueName} League
                </Text>

                {/* <Text size="sm" c="dimmed" mb="xs">
                    Game Days: {team.gameDays}
                </Text> */}
            </Card>
        </Link>
    );
};