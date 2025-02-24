import { Card, Group, Text } from '@mantine/core';

import { formatGameTime } from '@/utils/dateTime';

export default function GamesList({ games, primaryColor }) {

    if (!games.length) {
        return (
            <Text mt="lg" align="center">
                No games currently listed for this team.
            </Text>
        );
    }

    const gameList = games.map(game => (
        <Card key={game.$id} mt="sm" radius="md" padding="sm" withBorder>
            <Group justify="space-between">
                {/* <Text>{season.seasonName}</Text> */}
                <Group spacing="xs">
                    <span>
                        {formatGameTime(game.gameDate, game.timeZone)}
                    </span>
                </Group>
            </Group>

            {/* {getSeasonStatus(season)} */}
        </Card>
    ));

    return (
        <>
            {gameList}
        </>
    );
};