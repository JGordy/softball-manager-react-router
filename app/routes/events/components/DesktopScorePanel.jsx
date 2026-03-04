import { Badge, Card, Group, Stack, Text } from "@mantine/core";

import { IconActivity } from "@tabler/icons-react";

export default function DesktopScorePanel({
    game = {},
    gameInProgress,
    gameIsPast,
    team,
}) {
    const { score, opponent, opponentScore, isHomeGame, result } = game;

    const isWin = result === "won";
    const isLoss = result === "lost";
    const isDraw = result === "draw";

    // When isHomeGame=true  → our team is Home, opponent is Away
    // When isHomeGame=false → opponent is Home, our team is Away
    const ourTeam = team?.name ?? "Us";
    const theirTeam = opponent || "TBD";

    const homeTeam = isHomeGame ? ourTeam : theirTeam;
    const awayTeam = isHomeGame ? theirTeam : ourTeam;

    const homeScore = isHomeGame ? (score ?? 0) : (opponentScore ?? 0);
    const awayScore = isHomeGame ? (opponentScore ?? 0) : (score ?? 0);

    // Home team: lime = win, red = loss (result is always from our team's POV)
    const homeScoreColor = isWin
        ? isHomeGame
            ? "lime"
            : "red"
        : isLoss
          ? isHomeGame
              ? "red"
              : "lime"
          : undefined;

    // Away team is always the opposite of home
    const awayScoreColor = isWin
        ? isHomeGame
            ? "red"
            : "lime"
        : isLoss
          ? isHomeGame
              ? "lime"
              : "red"
          : undefined;

    const statusLabel = gameIsPast
        ? "Final"
        : gameInProgress
          ? "Live"
          : "Upcoming";

    const resultBadge =
        gameIsPast && result ? (
            <Badge
                color={isWin ? "lime" : isLoss ? "red" : "yellow"}
                variant="light"
                size="xs"
            >
                {isWin ? "Win" : isLoss ? "Loss" : isDraw ? "Draw" : result}
            </Badge>
        ) : gameInProgress ? (
            <Badge
                color="lime"
                variant="filled"
                size="xs"
                leftSection={<IconActivity size={10} />}
            >
                LIVE
            </Badge>
        ) : null;

    return (
        <Card
            withBorder
            radius="lg"
            py="sm"
            px="xl"
            w={560}
            data-testid="score-panel-compact"
        >
            <Group justify="center" align="center" gap="xs" wrap="nowrap">
                {/* Away team — left side */}
                <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text
                        size="sm"
                        fw={600}
                        ta="center"
                        style={{ whiteSpace: "nowrap" }}
                    >
                        {awayTeam}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                        Away
                    </Text>
                </Stack>

                {/* Scores */}
                <Group gap={4} align="center" wrap="nowrap">
                    <Text
                        size="xl"
                        fw={800}
                        lh={1}
                        c={awayScoreColor}
                        data-testid="score-b"
                    >
                        {awayScore}
                    </Text>
                    <Text size="xs" fw={700} c="dimmed" px={2}>
                        –
                    </Text>
                    <Text
                        size="xl"
                        fw={800}
                        lh={1}
                        c={homeScoreColor}
                        data-testid="score-a"
                    >
                        {homeScore}
                    </Text>
                </Group>

                {/* Home team — right side */}
                <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text
                        size="sm"
                        fw={600}
                        ta="center"
                        style={{ whiteSpace: "nowrap" }}
                    >
                        {homeTeam}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                        Home
                    </Text>
                </Stack>

                {/* Status badge */}
                {resultBadge}
            </Group>

            <Text size="xs" c="dimmed" ta="center" mt={2}>
                {statusLabel}
            </Text>
        </Card>
    );
}
