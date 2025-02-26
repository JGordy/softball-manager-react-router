import { Link } from 'react-router';

import {
    Button,
    Card,
    Group,
    Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconPlus } from '@tabler/icons-react';

import AddSeason from '@/forms/AddSeason';

export default function SeasonList({
    seasons,
    teamId,
    managerView,
    primaryColor,
}) {

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

    const openModal = () => modals.open({
        title: 'Add a New Season',
        children: (
            <AddSeason
                actionRoute={`/team/${teamId}`}
                buttonColor={primaryColor}
                teamId={teamId}
            />
        ),
    });

    const addSeasonCta = (
        <Button
            mt="md"
            variant="filled"
            color={primaryColor}
            onClick={openModal}
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
                    {getSeasonStatus(season)}
                    <Group>
                        <Text>
                            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                        </Text>
                    </Group>
                </Group>

                {/* TODO: Add current or past record based on game results */}
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