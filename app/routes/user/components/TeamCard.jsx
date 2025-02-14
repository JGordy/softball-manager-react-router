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
    IconCalendar,
    // IconCurrencyDollar,
    IconMapPin,
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

                <Group mb="xs">
                    <Text size="sm" c="dimmed">
                        Gender Mix: {team.genderMix}
                    </Text>
                </Group>

                <Text size="sm" c="dimmed" mb="xs">
                    League: {team.leagueName}
                </Text>

                {/* <Text size="sm" c="dimmed" mb="xs">
                    Game Days: {team.gameDays}
                </Text> */}
            </Card>
        </Link>
    );
};