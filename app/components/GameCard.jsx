import { Link } from 'react-router';
import { Card, Group, Text } from '@mantine/core';

import { formatGameTime } from '@/utils/dateTime';

const getGameResultColor = (result) => {
    if (result === 'won') return 'green';
    if (result === 'lost') return 'red';
    return 'yellow';
};

const getGameStatus = (date, result, score, opponentScore) => {
    const today = new Date();
    const gameDate = new Date(date);

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    if (gameDate < todayStart) {
        const resultsText = result
            ? `${result.charAt(0).toUpperCase()} ${score} - ${opponentScore}`
            : 'Results Pending';

        return {
            status: 'past',
            text: <Text align={'right'} c={getGameResultColor(result)}>{resultsText}</Text>,
        };
    }

    if (gameDate >= todayStart && gameDate < todayEnd) {
        const timeDiff = gameDate.getTime() - today.getTime();
        const hoursUntilGame = Math.ceil(timeDiff / (1000 * 3600));
        const hoursUntilText = hoursUntilGame === 1 ? '1 hour' : `${hoursUntilGame} hours`;

        return {
            status: 'today',
            text: (hoursUntilGame > 0)
                ? <Text align={'right'} span fw={700} c="green">{hoursUntilText} away!</Text>
                : null,
        };
    }

    if (gameDate < oneWeekFromNow) {
        const timeDiff = gameDate.getTime() - today.getTime();
        const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''}`;

        return {
            status: 'future',
            text: <Text align={'right'} span fw={700} c="green">{daysUntilText} away!</Text>,
        };
    }

    return {
        status: 'future',
        text: null,
    };
};

export default function GameCard({
    $id,
    gameDate,
    teamName,
    isHomeGame,
    result,
    score,
    opponent,
    opponentScore,
    timeZone,
}) {
    const formattedHeader = `${isHomeGame ? 'vs' : '@'} ${opponent || 'TBD'}`;

    const gameStatus = getGameStatus(gameDate, result, score, opponentScore);

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    return (
        <Link key={$id} to={`/events/${$id}`}>
            <Card
                className="game-card"
                my="md"
                radius="md"
                py="lg"
                withBorder
            >
                <Text fw={400} size="lg" mb="md">
                    {teamName && <Text fw={700} span>{teamName + ' '}</Text>}
                    {formattedHeader}
                </Text>
                <Group justify="space-between">
                    <Text>{formattedGameTime}</Text>
                    {gameStatus.text}
                </Group>
            </Card>
        </Link>
    );
}