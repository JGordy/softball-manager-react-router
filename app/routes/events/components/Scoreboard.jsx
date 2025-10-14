import { Box, Card, Center, Group, Text, Title } from "@mantine/core";

export default function Scoreboard({
    game = {},
    gameIsPast,
    gameInProgress,
    team,
}) {
    const { score, opponent, opponentScore, isHomeGame, result } = game;

    const isWin = result === "won";
    const isLoss = result === "lost";

    return (
        <Box mt="xl">
            <Title order={4} align="center" mb="sm">
                {team?.name} {isHomeGame ? "vs" : "@"} {opponent || "TBD"}
            </Title>
            <Card
                className="score-container"
                radius="lg"
                p="xs"
                maw="30%"
                withBorder
                mx="auto"
            >
                <Group justify="center" align="center">
                    <Text size="xl" fw={700} c={isWin ? "green" : ""}>
                        {score || "0"}
                    </Text>
                    <div>-</div>
                    <Text size="xl" fw={700} c={isLoss ? "red" : ""}>
                        {opponentScore || "0"}
                    </Text>
                </Group>
            </Card>

            {gameInProgress && (
                <Center mt="md">
                    <Text size="sm" c="green">
                        Game is live!
                    </Text>
                </Center>
            )}

            {gameIsPast && !result && (
                <Center mt="md">
                    <Text size="sm" c="yellow">
                        Game result pending*
                    </Text>
                </Center>
            )}
        </Box>
    );
}
