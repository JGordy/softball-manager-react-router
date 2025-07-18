import {
    Box,
    Card,
    Center,
    Group,
    Text,
    Title,
} from '@mantine/core';

export default function Scoreboard({
    game = {},
    gameIsPast,
    team,
}) {

    const {
        score,
        opponent,
        opponentScore,
        isHomeGame,
        result,
    } = game;

    return (
        <Box mt="xl">
            <Title order={4} align="center" mb="sm">
                {team?.name} {isHomeGame ? 'vs' : '@'} {opponent || "TBD"}
            </Title>
            <Group justify="center" gap="xl" align="center">
                <Card withBorder radius="md" px="xl">
                    <Text>{score || '0'}</Text>
                </Card>

                <div>-</div>

                <Card withBorder radius="md" px="xl">
                    <Text>{opponentScore || '0'}</Text>
                </Card>
            </Group>

            {gameIsPast && !result && (
                <Center mt="md">
                    <Text size="sm" c="yellow">Game result pending*</Text>
                </Center>
            )}
        </Box>
    );
}