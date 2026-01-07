import { ScrollArea, Text, Group, Stack, Paper, Badge } from "@mantine/core";
import { IconCaretUpFilled, IconCaretDownFilled } from "@tabler/icons-react";

function getRunnerMovement(baseState, playerChart) {
    if (!baseState || !playerChart) return [];

    const movements = [];

    try {
        const state =
            typeof baseState === "string" ? JSON.parse(baseState) : baseState;

        // Helper to get player name by ID
        const getPlayerName = (playerId) => {
            const player = playerChart.find((p) => p.$id === playerId);
            return player
                ? `${player.firstName} ${player.lastName.charAt(0)}.`
                : "Runner";
        };

        // First, show who scored
        if (
            state.scored &&
            Array.isArray(state.scored) &&
            state.scored.length > 0
        ) {
            state.scored.forEach((playerId) => {
                movements.push(`${getPlayerName(playerId)} scores`);
            });
        }

        // Then show the resulting base state (who's on base now)
        const baseOccupants = [];
        if (state.first)
            baseOccupants.push(`1B: ${getPlayerName(state.first)}`);
        if (state.second)
            baseOccupants.push(`2B: ${getPlayerName(state.second)}`);
        if (state.third)
            baseOccupants.push(`3B: ${getPlayerName(state.third)}`);

        if (baseOccupants.length > 0) {
            movements.push(baseOccupants.join(", "));
        }
    } catch (e) {
        console.warn("Failed to parse baseState for runner movement", e);
    }

    return movements;
}

export default function PlayHistoryList({ logs, playerChart }) {
    if (!logs.length) {
        return (
            <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed" ta="center">
                    No plays logged yet for this game.
                </Text>
            </Paper>
        );
    }

    return (
        <ScrollArea h={400} offsetScrollbars>
            <Stack gap="xs">
                {[...logs].reverse().map((log) => {
                    const runnerMovements = getRunnerMovement(
                        log.baseState,
                        playerChart,
                    );

                    return (
                        <Paper key={log.$id} withBorder p="xs" radius="md">
                            <Stack gap={4}>
                                <Group justify="space-between" wrap="nowrap">
                                    <Text
                                        size="sm"
                                        fw={700}
                                        style={{ flex: 1 }}
                                    >
                                        {log.description}
                                    </Text>
                                    <Group gap={5} wrap="nowrap">
                                        {log.rbi > 0 && (
                                            <Badge
                                                size="sm"
                                                color="blue"
                                                variant="filled"
                                            >
                                                {log.rbi}{" "}
                                                {log.rbi === 1 ? "RBI" : "RBIs"}
                                            </Badge>
                                        )}
                                        {log.outsOnPlay > 0 && (
                                            <Badge
                                                size="sm"
                                                color="red"
                                                variant="filled"
                                            >
                                                {log.outsOnPlay}{" "}
                                                {log.outsOnPlay === 1
                                                    ? "Out"
                                                    : "Outs"}
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap={4}>
                                        {log.halfInning === "top" ? (
                                            <IconCaretUpFilled
                                                size={12}
                                                color="var(--mantine-color-dimmed)"
                                            />
                                        ) : (
                                            <IconCaretDownFilled
                                                size={12}
                                                color="var(--mantine-color-dimmed)"
                                            />
                                        )}
                                        <Text size="xs" c="dimmed">
                                            {log.inning}
                                        </Text>
                                    </Group>
                                    {runnerMovements.length > 0 && (
                                        <Text
                                            size="xs"
                                            c="dimmed"
                                            style={{ lineHeight: 1.3 }}
                                            ta="right"
                                        >
                                            {runnerMovements.join(", ")}
                                        </Text>
                                    )}
                                </Group>
                            </Stack>
                        </Paper>
                    );
                })}
            </Stack>
        </ScrollArea>
    );
}
