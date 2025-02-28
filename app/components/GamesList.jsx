import {
    Card,
    Center,
    Group,
    ScrollArea,
    Text,
} from '@mantine/core';

import { formatGameTime } from '@/utils/dateTime';

export default function GamesList({
    games,
    height = "55vh",
    showTeam = true,
}) {

    const getGameStatus = (game) => {
        const { gameDate: date } = game;
        const today = new Date();
        const gameDate = new Date(date);
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(today.getDate() + 7); // Add 7 days

        if (today.getDate() < oneWeekFromNow.getDate() &&
            today.getMonth() < oneWeekFromNow.getMonth() &&
            today.getFullYear() < oneWeekFromNow.getFullYear()) {
            const timeDiff = gameDate.getTime() - today.getTime();
            const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days
            const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''}`;

            return (
                <Text span fw={700} c="green">
                    {daysUntilText} away!
                </Text>
            );
        }

        if (gameDate.getDate() === today.getDate() &&
            gameDate.getMonth() === today.getMonth() &&
            gameDate.getFullYear() === today.getFullYear()) {

            const timeDiff = gameDate.getTime() - today.getTime();
            const hoursUntilGame = Math.ceil(timeDiff / (1000 * 3600)); // Calculate hours
            const hoursUntilText = hoursUntilGame === 1 ? '1 hour' : `${hoursUntilGame} hours`; //Proper pluralization.
            return (
                <Text span fw={700} c="green">
                    {hoursUntilText} away!
                </Text>
            );
        }

        // Your logic for games more than a week away (optional)
        return null;
    };

    if (!games.length) {
        return (
            <Center mt="md">
                <Text>No games currently listed.</Text>
            </Center>
        );
    }

    return (
        <ScrollArea h={height} mt="md">
            {games.map(game => {
                return (
                    <Card key={game.$id} mb="sm" radius="md" padding="sm" withBorder>
                        <Group justify="space-between">
                            <Text fw={700}>
                                {showTeam && game.teamName + " "}{game.isHomeGame ? 'vs' : '@'} {game.opponent || 'TBD'}
                            </Text>
                            {getGameStatus(game)}
                            <Text>
                                {formatGameTime(game.gameDate, game.timeZone)}
                            </Text>
                        </Group>
                    </Card>
                )
            })}
        </ScrollArea>
    )
}