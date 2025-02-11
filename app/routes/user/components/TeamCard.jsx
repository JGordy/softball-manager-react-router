import { Link } from "react-router";

import {
    Card,
    Text,
    Group,
    ThemeIcon,
} from '@mantine/core';

import {
    IconCalendar,
    IconCurrencyDollar,
    IconMapPin,
} from '@tabler/icons-react';

export default function TeamCard(team) {
    console.log({ team });

    return (
        <Link to={`/teams/${team.$id}`}>
            <Card
                key={team.$id}
                p="lg"
                shadow="sm"
                radius="md"
                withBorder
                // onClick={handleCardClick} // Add click handler
                style={{ cursor: 'pointer', width: '100%' }}
            >
                <Card.Section>
                    <Text weight={500} size="lg">
                        {team.name}
                    </Text>
                </Card.Section>

                <Card.Section mt="sm">
                    <Group spacing="xs">
                        <ThemeIcon variant="light" color="blue">
                            <IconMapPin size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                            {team.location || "Location not specified"} {/* Handle null location */}
                        </Text>
                    </Group>
                </Card.Section>


                <Card.Section mt="xs">
                    <Group spacing="xs">
                        <ThemeIcon variant="light" color="green">
                            <IconCalendar size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                            {new Date(team.seasonStartDate).toLocaleDateString()} - {new Date(team.seasonEndDate).toLocaleDateString()}
                        </Text>
                    </Group>
                </Card.Section>

                <Card.Section mt="xs">
                    <Group spacing="xs">
                        <ThemeIcon variant="light" color="yellow">
                            <IconCurrencyDollar size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                            {team.signUpFee}
                        </Text>
                    </Group>
                </Card.Section>

                <Card.Section mt="xs">
                    <Group spacing="xs">
                        <Text size="sm" c="dimmed">
                            {team.genderMix}
                        </Text>
                    </Group>
                </Card.Section>

                <Card.Section mt="xs">
                    <Text size="sm" c="dimmed">
                        League: {team.leagueName}
                    </Text>
                </Card.Section>

                <Card.Section mt="xs">
                    <Text size="sm" c="dimmed">
                        Game Days: {team.gameDays}
                    </Text>
                </Card.Section>
            </Card>
        </Link>
    );
};