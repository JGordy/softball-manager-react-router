import { Card, Group, Stack, Text, Badge, Avatar } from "@mantine/core";
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
        <Card withBorder p="sm" radius="md" bg="blue.9" {...props}>
            <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap" gap="md" style={{ minWidth: 0, flex: 1 }}>
                    <Avatar
                        src={activePlayer.avatarUrl}
                        alt={`${activePlayer.firstName} ${activePlayer.lastName}`}
                        radius="xl"
                        size="lg"
                        color="lime"
                    >
                        {activePlayer.firstName?.[0]}
                        {activePlayer.lastName?.[0]}
                    </Avatar>
                    <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                        <Group gap="xs" wrap="nowrap">
                            <Text
                                size="xs"
                                fw={700}
                                c="lime.4"
                                tt="uppercase"
                                lts={1}
                                style={{ whiteSpace: "nowrap" }}
                            >
                                CURRENT BATTER
                            </Text>
                            {isSubstitute && (
                                <Badge
                                    size="xs"
                                    color="orange"
                                    variant="filled"
                                >
                                    SUB
                                </Badge>
                            )}
                        </Group>
                        <Text
                            size="xl"
                            fw={800}
                            c="white"
                            style={{ lineHeight: 1.1 }}
                            truncate="end"
                        >
                            {activePlayer.firstName}
                            {activePlayer.lastName
                                ? ` ${activePlayer.lastName}`
                                : ""}
                        </Text>
                        {isSubstitute && (
                            <Text size="xs" c="blue.2" truncate="end">
                                for {currentBatter.firstName}
                                {currentBatter.lastName
                                    ? ` ${currentBatter.lastName}`
                                    : ""}
                            </Text>
                        )}
                    </Stack>
                </Group>
                <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
                    <Text
                        size="xs"
                        fw={700}
                        c="white"
                        tt="uppercase"
                        opacity={0.7}
                        lts={1}
                        style={{ whiteSpace: "nowrap" }}
                    >
                        Game Stats
                    </Text>
                    <Group gap={6} align="flex-end" wrap="nowrap">
                        <Text
                            size="md"
                            fw={800}
                            c="white"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {hits.length}/{ab}
                        </Text>
                        {rbis > 0 && (
                            <Badge size="xs" color="lime" variant="filled">
                                {rbis} RBI
                            </Badge>
                        )}
                    </Group>
                    {hits.length > 0 && (
                        <Text size="xs" c="blue.1" fw={600} truncate="end">
                            [{hitTypes}]
                        </Text>
                    )}
                </Stack>
            </Group>
        </Card>
    );
}
