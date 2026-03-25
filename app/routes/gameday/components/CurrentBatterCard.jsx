import { Card, Group, Stack, Text, Badge } from "@mantine/core";
import { HITS, WALKS, getUILabel } from "@/constants/scoring";
import { getActivePlayerInSlot } from "../utils/gamedayUtils";

export default function CurrentBatterCard({ currentBatter, logs, ...props }) {
    if (!currentBatter) return null;

    // Resolve the currently active player (original or sub) for display
    const activePlayer = getActivePlayerInSlot(currentBatter);
    const isSubstitute = !!currentBatter.substitutions?.length;

    // Gather all IDs this slot has ever occupied (original + all subs)
    const slotPlayerIds = new Set([currentBatter.$id]);
    currentBatter.substitutions?.forEach((s) => slotPlayerIds.add(s.playerId));

    const batterLogs = logs.filter(
        (l) => slotPlayerIds.has(l.playerId) && l.eventType !== "SUB",
    );
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
        <Card withBorder p="sm" radius="md" bg="blue" {...props}>
            <Group justify="space-between" wrap="nowrap">
                <Stack gap={0}>
                    <Group gap="xs">
                        <Text size="xs" fw={700} c="white">
                            CURRENT BATTER
                        </Text>
                        {isSubstitute && (
                            <Badge size="xs" color="orange" variant="filled">
                                SUB
                            </Badge>
                        )}
                    </Group>
                    <Text size="lg" fw={800} c="white">
                        {activePlayer.firstName}
                        {activePlayer.lastName
                            ? ` ${activePlayer.lastName}`
                            : ""}
                    </Text>
                    {isSubstitute && (
                        <Text size="xs" c="blue.2">
                            for {currentBatter.firstName}
                            {currentBatter.lastName
                                ? ` ${currentBatter.lastName}`
                                : ""}
                        </Text>
                    )}
                </Stack>
                <Stack gap={2} align="flex-end">
                    <Text size="xs" fw={700} c="white">
                        GAME STATS
                    </Text>
                    <Group gap="xs">
                        <Text size="sm" fw={700} c="white">
                            {hits.length}/{ab}
                        </Text>
                        {hits.length > 0 && (
                            <Text size="xs" c="white">
                                [{hitTypes}]
                            </Text>
                        )}
                        {rbis > 0 && (
                            <Badge size="xs" color="lime" variant="light">
                                {rbis} RBI
                            </Badge>
                        )}
                    </Group>
                </Stack>
            </Group>
        </Card>
    );
}
