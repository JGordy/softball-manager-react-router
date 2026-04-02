import { Card, Group, Stack, Text, Button } from "@mantine/core";
import { IconArrowBackUp } from "@tabler/icons-react";
import { getRunnerMovement } from "../utils/gamedayUtils";

export default function LastPlayCard({
    lastLog,
    onUndo,
    isSubmitting,
    playerChart,
}) {
    const runnerMovements = getRunnerMovement(lastLog.baseState, playerChart);

    return (
        <Card
            withBorder
            p="sm"
            radius="md"
            w="100%"
            style={{
                borderLeft: "6px solid var(--mantine-color-lime-4)",
            }}
        >
            <Group justify="space-between" align="center" wrap="nowrap">
                <Stack gap={4}>
                    <Text size="xs" fw={700} c="lime.6" tt="uppercase" lts={1}>
                        LAST PLAY
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
