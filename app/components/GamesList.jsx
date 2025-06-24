import {
    Center,
    ScrollArea,
    Text,
} from '@mantine/core';

import GameCard from '@/components/GameCard';

export default function GamesList({
    games,
    height = "50vh",
    sortOrder = "asc",
}) {

    if (!games.length) {
        return (
            <Center mt="md">
                <Text>No games currently listed.</Text>
            </Center>
        );
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const sortedGames = [...games].sort((a, b) => {
        const dateA = new Date(a.gameDate);
        const dateB = new Date(b.gameDate);

        const isPastA = dateA < todayStart;
        const isPastB = dateB < todayStart;

        if (isPastA && !isPastB) return 1;
        if (!isPastA && isPastB) return -1;

        // If both are past, sort descending (most recent first)
        if (isPastA && isPastB) {
            return dateB - dateA;
        }

        // Both are future, sort by sortOrder
        if (sortOrder === 'dsc') return dateB - dateA;
        return dateA - dateB;
    });

    return (
        <ScrollArea h={height}>
            {sortedGames.map(game => (
                <GameCard
                    {...game}
                    key={game.$id}
                />
            ))}
        </ScrollArea>
    )
}