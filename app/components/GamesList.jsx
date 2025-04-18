import {
    Center,
    ScrollArea,
    Text,
} from '@mantine/core';

import GameCard from '@/components/GameCard';

export default function GamesList({
    games,
    height = "50vh",
}) {

    if (!games.length) {
        return (
            <Center mt="md">
                <Text>No games currently listed.</Text>
            </Center>
        );
    }

    return (
        <ScrollArea h={height}>
            {games.map(game => (
                <GameCard
                    {...game}
                    key={game.$id}
                />
            ))}
        </ScrollArea>
    )
}