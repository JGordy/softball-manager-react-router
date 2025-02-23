import { Link } from 'react-router';

import {
    Button,
    Card,
    Group,
    Text,
} from '@mantine/core';

import {
    // IconCalendarRepeat,
    // IconCurrencyDollar,
    // IconFriends,
    // IconMapPin,
    IconPlus,
} from '@tabler/icons-react';

export default function SeasonList({
    seasons,
    managerView,
    primaryColor,
    handleSeasonListModal,
}) {

    const textProps = {
        size: "md",
        // c: "dimmed",
    };

    const getSeasonStatus = (season) => {

        const today = new Date();
        const oneMonthFromNow = new Date(today);
        oneMonthFromNow.setMonth(today.getMonth() + 1);

        const startDate = new Date(season.startDate);
        const endDate = new Date(season.endDate);

        if (startDate <= today && today <= endDate) {
            const { games } = season;
            if (games && games.length > 0) {
                const upcomingGame = games
                    .map(game => new Date(game.gameDate))
                    .filter(gameDate => gameDate > today)
                    .sort((a, b) => a - b)[0]; // Find the next game

                if (upcomingGame) {
                    const { isHomeGame, opponent } = upcomingGame;
                    const timeDiff = upcomingGame.getTime() - today.getTime();
                    const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days

                    const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''}`;

                    return (
                        <Text span fw={700} c="green">
                            Next game {isHomeGame ? 'vs' : '@'} {opponent} in {daysUntilText}!
                        </Text>
                    );
                }
            }
            return 'Season in progress';
        }

        if (startDate > today && startDate <= oneMonthFromNow) {
            const timeDiff = startDate.getTime() - today.getTime();
            const daysUntilStart = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days

            const daysUntilText = `${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;

            return (
                <Text span fw={700} c="green">
                    Starts in {daysUntilText}!
                </Text>
            );
        }

        return null;
    }

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
                {managerView && addSeasonCta}
            </>
        );
    }

    const seasonContent = seasons.map((season) => (
        <Link to={`/season/${season.$id}`} key={season.$id}>
            <Card key={season.$id} mt="sm" radius="md" padding="sm" withBorder>
                <Group justify="space-between">
                    <Text>{season.seasonName}</Text>
                    <Group spacing="xs">
                        <Text {...textProps}>
                            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                        </Text>
                    </Group>
                </Group>

                {getSeasonStatus(season)}

                {/* TODO: Add current or past record based on game results */}

                {/* <Group mt="sm" gap="lg"> */}
                {/* <Group gap="5px">
                        <IconMapPin size={18} />
                        <Text {...textProps}>
                            {season.location || "Not specified"}
                        </Text>
                    </Group> */}

                {/* <Group gap="5px">
                        <IconCalendarRepeat size={18} />
                        <Text {...textProps}>
                            {`${season.gameDays}s`}
                        </Text>
                    </Group> */}

                {/* <Group gap="5px">
                        <IconFriends size={18} />
                        <Text {...textProps}>
                            {season.leagueType}
                        </Text>
                    </Group> */}

                {/* <Group gap="5px">
                        <IconCurrencyDollar size={18} />
                        <Text {...textProps}>
                            {`${season.signUpFee || 'TBD'}/player`}
                        </Text>
                    </Group> */}
                {/* </Group> */}
            </Card>
        </Link>
    ));

    return (
        <>
            {seasonContent}
            {managerView && addSeasonCta}
        </>
    );
}