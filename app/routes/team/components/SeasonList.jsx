import {
    Button,
    Card,
    Group,
    Text,
    ThemeIcon,
} from '@mantine/core';

import { IconCalendarRepeat, IconMapPin, IconFriends, IconPlus } from '@tabler/icons-react';

export default function SeasonList({
    seasons,
    coachView,
    primaryColor,
    handleSeasonListModal,
}) {

    const textProps = {
        size: "md",
        // c: "dimmed",
    };

    const addSeasonCta = (
        <Button
            mt="md"
            variant="filled"
            color={primaryColor}
            onClick={handleSeasonListModal}
            autoContrast
            fullWidth
        >
            <IconPlus size={20} />
            Add New Season
        </Button>
    );

    if (!seasons.length) {
        return (
            <>
                <Text mt="lg" align="center">
                    No seasons currently listed for this team.
                </Text>
                {coachView && addSeasonCta}
            </>
        );
    }

    const seasonContent = seasons.map((season) => (
        <Card key={season.$id} mt="sm" radius="md" padding="sm" withBorder>
            <Group justify="space-between">
                <Text>{season.seasonName}</Text>
                <Group spacing="xs">
                    <Text {...textProps}>
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                    </Text>
                </Group>
            </Group>

            <Group mt="sm" gap="lg">
                <Group gap="5px">
                    <IconMapPin size={18} />
                    <Text {...textProps}>
                        {season.location || "Not specified"}
                    </Text>
                </Group>

                <Group gap="5px">
                    <IconCalendarRepeat size={18} />
                    <Text {...textProps}>
                        {`${season.gameDays}s`}
                    </Text>
                </Group>

                <Group gap="5px">
                    <IconFriends size={18} />
                    <Text {...textProps}>
                        {season.leagueType}
                    </Text>
                </Group>
            </Group>
        </Card>
    ));

    return (
        <>
            {seasonContent}
            {coachView && addSeasonCta}
        </>
    );
}