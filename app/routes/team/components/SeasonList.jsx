import { Link } from 'react-router';

import {
    Button,
    Card,
    Group,
    ScrollArea,
    Text,
} from '@mantine/core';

import { IconPlus } from '@tabler/icons-react';

import AddSeason from '@/forms/AddSeason';

import useModal from '@/hooks/useModal';

export default function SeasonList({
    seasons,
    teamId,
    managerView,
    primaryColor,
}) {
    const { openModal } = useModal();

    const getSeasonStatus = (season) => {
        const today = new Date();
        const oneMonthFromNow = new Date(today);
        oneMonthFromNow.setMonth(today.getMonth() + 1);

        const startDate = new Date(season.startDate);
        const endDate = new Date(season.endDate);

        if (startDate <= today && today <= endDate) {
            const { games } = season;
            if (games && games.length > 0) {
                // Find the upcoming game object, not just the date
                const upcomingGame = games
                    .filter(game => new Date(game.gameDate) > today)
                    .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate))[0];

                if (upcomingGame) {
                    const timeDiff = new Date(upcomingGame.gameDate).getTime() - today.getTime();
                    const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days

                    const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''}`;

                    return (
                        <Text span fw={700} c="green">
                            Next game {upcomingGame.isHomeGame ? 'vs' : '@'} {upcomingGame.opponent} in {daysUntilText}!
                        </Text>
                    );
                }
            }
            return 'Season in progress';
        }
    };

    const openAddSeasonModal = () => openModal({
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
            onClick={openAddSeasonModal}
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
                {managerView && addSeasonCta}
                <Text mt="lg" align="center">
                    No seasons currently listed for this team.
                </Text>
            </>
        );
    }

    return (
        <>
            {managerView && addSeasonCta}
            <ScrollArea h="55vh">
                {seasons.map((season) => (
                    <Link to={`/season/${season.$id}`} key={season.$id}>
                        <Card key={season.$id} mt="sm" radius="md" padding="sm" withBorder>
                            <Group justify="space-between">
                                <Text>{season.seasonName}</Text>
                                <Text>
                                    {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                                </Text>
                                {getSeasonStatus(season)}
                            </Group>

                            {/* TODO: Add current or past record based on game results */}
                        </Card>
                    </Link>
                ))}
            </ScrollArea>
        </>
    );
}