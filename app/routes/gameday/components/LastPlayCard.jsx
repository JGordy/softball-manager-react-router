import { Card, Stack, Text, Button } from "@mantine/core";
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
        <Card withBorder p="sm" radius="md" mt="auto" w="100%">
            <Stack gap={4}>
                <Text size="sm" fw={700} c="dimmed">
                    LAST PLAY
                </Text>
                <Text
                    size="sm"
                    fw={600}
                    lineClamp={3}
                    style={{ lineHeight: 1.3 }}
                >
                    {lastLog.description}
                </Text>
                {runnerMovements.length > 0 && (
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.2 }}>
                        {runnerMovements.join(", ")}
                    </Text>
                )}
                {onUndo && (
                    <Button
                        variant="light"
                        size="xs"
                        color="red"
                        mt={5}
                        leftSection={<IconArrowBackUp size={12} />}
                        onClick={onUndo}
                        loading={isSubmitting}
                        fullWidth
                    >
                        Undo
                    </Button>
                )}
            </Stack>
        </Card>
    );
}
