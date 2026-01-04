import { Card, Group, Stack, Text, Badge } from "@mantine/core";
import { HITS, WALKS, getUILabel } from "./scoringConstants";

export default function CurrentBatterCard({ currentBatter, logs }) {
    if (!currentBatter) return null;

    const batterLogs = logs.filter((l) => l.playerId === currentBatter.$id);
    const hits = batterLogs.filter((l) => HITS.includes(l.eventType));
    // At-bats exclude walks and errors
    const nonAtBatEvents = [...WALKS, "error"];
    const ab = batterLogs.filter(
        (l) => !nonAtBatEvents.includes(l.eventType),
    ).length;
    const rbis = batterLogs.reduce((sum, l) => sum + (l.rbi || 0), 0);

    // Map database eventType values to UI-friendly labels
    const hitTypes = hits.map((h) => getUILabel(h.eventType)).join(", ");

    return (
        <Card withBorder p="sm" radius="md">
            <Group justify="space-between">
                <Stack gap={0}>
                    <Text size="xs" fw={700} c="dimmed">
                        CURRENT BATTER
                    </Text>
                    <Text size="lg" fw={800}>
                        {currentBatter.firstName} {currentBatter.lastName}
                    </Text>
                </Stack>
                <Stack gap={2} align="flex-end">
                    <Text size="xs" fw={700} c="dimmed">
                        GAME STATS
                    </Text>
                    <Group gap="xs">
                        <Text size="sm" fw={700}>
                            {hits.length}/{ab}
                        </Text>
                        {hits.length > 0 && (
                            <Text size="xs" c="dimmed">
                                [{hitTypes}]
                            </Text>
                        )}
                        {rbis > 0 && (
                            <Badge size="xs" color="blue" variant="light">
                                {rbis} RBI
                            </Badge>
                        )}
                    </Group>
                </Stack>
            </Group>
        </Card>
    );
}
