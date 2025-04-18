import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconPlus } from '@tabler/icons-react';

import AddSingleGame from '@/forms/AddSingleGame';

import GamesList from '@/components/GamesList';

import sortByDate from '@/utils/sortByDate';

export default function GamesListContainer({
    games,
    seasons,
    teamId,
    primaryColor,
    managerView,
}) {

    const sortedGames = sortByDate(games, 'gameDate');

    const openModal = () => modals.open({
        title: 'Add a New Game',
        children: (
            <AddSingleGame
                action="add-single-game"
                actionRoute={`/team/${teamId}`}
                teamId={teamId}
                seasonId={null}
                seasons={seasons}
                confirmText="Create Game"
            />
        ),
    });

    return (
        <>
            {managerView && (
                <Button
                    my="md"
                    color={primaryColor}
                    onClick={openModal}
                    autoContrast
                    fullWidth
                >
                    <IconPlus size={20} />
                    Add New Game
                </Button>
            )}

            {!sortedGames.length && (
                <Text mt="lg" align="center">
                    No games currently listed for this team.
                </Text>
            )}

            <GamesList games={sortedGames} />
        </>
    );
};