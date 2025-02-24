import { Card, Group, Text } from '@mantine/core';

import sortByDate from '@/utils/sortByDate';
import { formatGameTime } from '@/utils/dateTime';

export default function GamesList({ games, primaryColor }) {

    const sortedGames = sortByDate(games, 'gameDate');

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

    return (
        <>
            {!sortedGames.length && (
                <Text mt="lg" align="center">
                    No games currently listed for this team.
                </Text>
            )}
            {sortedGames.map(game => {
                return (
                    <Card key={game.$id} mt="sm" radius="md" padding="sm" withBorder>
                        <Group justify="space-between">
                            <Text size="lg">
                                {game.isHomeGame ? 'vs' : '@'} {game.opponent || 'TBD'}
                            </Text>
                            {getGameStatus(game)}
                            <Text>
                                {formatGameTime(game.gameDate, game.timeZone)}
                            </Text>
                        </Group>
                    </Card>
                )
            })}
        </>
    );
};