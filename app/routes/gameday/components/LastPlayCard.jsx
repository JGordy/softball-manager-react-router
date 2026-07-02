import { Card, Group, Stack, Text, Button } from "@mantine/core";
import { IconArrowBackUp } from "@tabler/icons-react";
import { getRunnerMovement, isOpponentPlay } from "../utils/gamedayUtils";

export default function LastPlayCard({
    lastLog,
    onUndo,
    isSubmitting,
    playerChart,
    isHomeGame,
}) {
    const runnerMovements = getRunnerMovement(lastLog.baseState, playerChart);
    const isOpponent = isOpponentPlay(lastLog, isHomeGame);

    return (
        <Card
            className="tour-last-play-card"
            p="sm"
            radius="md"
            w="100%"
            bg={isOpponent ? "rgba(229, 115, 115, 0.08)" : undefined}
            style={{
                borderLeft: isOpponent
                    ? "6px solid var(--mantine-color-red-6)"
                    : "6px solid var(--mantine-color-lime-4)",
            }}
        >
            <Group justify="space-between" align="center" wrap="nowrap">
                <Stack gap={4}>
                    <Text
                        size="xs"
                        fw={700}
                        c={isOpponent ? "red.6" : "lime.6"}
                        tt="uppercase"
                        lts={1}
                    >
                        {isOpponent ? "Opponent's Last Play" : "Last Play"}
                    </Text>
                    <Text
                        size="sm"
                        fw={600}
                        lineClamp={2}
                        style={{ lineHeight: 1.2 }}
                    >
                        {lastLog.description}
                    </Text>
                    {runnerMovements.length > 0 && (
                        <Text size="xs" c="dimmed" style={{ lineHeight: 1.1 }}>
                            {runnerMovements.join(", ")}
                        </Text>
                    )}
                </Stack>

                {onUndo && (
                    <Button
                        className="tour-undo-play-btn"
                        variant="filled"
                        size="sm"
                        color="orange.5"
                        radius="xl"
                        leftSection={<IconArrowBackUp size={16} />}
                        onClick={onUndo}
                        loading={isSubmitting}
                        px="md"
                        style={{ flexShrink: 0 }}
                    >
                        UNDO
                    </Button>
                )}
            </Group>
        </Card>
    );
}
