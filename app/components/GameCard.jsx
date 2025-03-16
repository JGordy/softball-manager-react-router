import { Link } from 'react-router';

import { Card, Group, Text } from '@mantine/core';

import { formatGameTime } from '@/utils/dateTime';

const getGameDateStatus = (date) => {
    const today = new Date();
    const gameDate = new Date(date);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const isPast = gameDate < todayStart;
    const isToday = gameDate >= todayStart && gameDate < todayEnd;
    const isFuture = gameDate >= todayEnd;

    return { isPast, isToday, isFuture };
};

const getGameStatusText = (date, status) => {
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

const getGameResultColor = (result) => {
    if (result === 'win') {
        return 'green';
    }

    if (result === 'loss') {
        return 'red';
    }

    return 'yellow';
}

// TODO: If the game is in the past but doesn't yet have results, display a message to the user saying that.

export default function GameCard({
    $id,
    gameDate,
    showTeam = true, // True in every place except the teams details page
    teamName,
    isHomeGame,
    result,
    score,
    opponent,
    opponentScore,
    timeZone,
}) {

    const formattedHeader = `${showTeam && teamName + " "}${isHomeGame ? 'vs' : '@'} ${opponent || 'TBD'}`;

    const gameStatus = getGameDateStatus(gameDate);
    const { isPast, isFuture, isToday } = gameStatus;
    const gameStatusText = getGameStatusText(gameDate, gameStatus);

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const didWin = result === 'win';
    const formattedResult = `${didWin ? 'W' : 'L'} ${score} - ${opponentScore}`;


    return (
        <Link key={$id} to={`/events/${$id}`}>
            <Card mb="sm" radius="md" padding="sm" withBorder>
                <Group justify="space-between">
                    <Text fw={700}>
                        {formattedHeader}
                    </Text>
                    {gameStatusText}
                    <Text>
                        {formattedGameTime}
                    </Text>
                    {result && (
                        <Text c={getGameResultColor(result)}>
                            {formattedResult}
                        </Text>
                    )}
                </Group>
            </Card>
        </Link>
    )
};