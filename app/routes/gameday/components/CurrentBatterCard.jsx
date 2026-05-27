import {
    Card,
    Group,
    Stack,
    Text,
    Badge,
    Avatar,
    TextInput,
    Collapse,
    UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { HITS, WALKS, getUILabel } from "@/constants/scoring";
import { getActivePlayerInSlot } from "../utils/gamedayUtils";
import MiniSprayChart from "@/components/MiniSprayChart/MiniSprayChart";

export default function CurrentBatterCard({
    currentBatter,
    logs,
    isOpponent = false,
    onNotesChange,
    ...props
}) {
    if (!currentBatter) return null;

    const [sprayChartOpened, { toggle: toggleSprayChart }] =
        useDisclosure(false);

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
                        alt={`${activePlayer.firstName}${
                            activePlayer.lastName
                                ? ` ${activePlayer.lastName}`
                                : ""
                        }`}
                        radius="xl"
                        size="lg"
                        color="lime"
                        style={{
                            border: "3px solid var(--mantine-color-lime-4)",
                        }}
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
                            {activePlayer.jerseyNumber && (
                                <Text
                                    inherit
                                    component="span"
                                    c="lime.4"
                                    mr={4}
                                >
                                    #{activePlayer.jerseyNumber}
                                </Text>
                            )}
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
            {isOpponent && (
                <Stack mt="md" gap="xs">
                    <TextInput
                        key={currentBatter.$id}
                        size="sm"
                        placeholder="Add notes (e.g. Lefty, fast, #12)"
                        defaultValue={currentBatter.notes || ""}
                        onBlur={(e) => onNotesChange?.(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                            }
                        }}
                        styles={{
                            input: {
                                backgroundColor: "rgba(0, 0, 0, 0.3)",
                                color: "white",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                "&::placeholder": {
                                    color: "rgba(255, 255, 255, 0.5)",
                                },
                            },
                        }}
                    />
                    {hits.length > 0 && (
                        <>
                            <UnstyledButton
                                onClick={toggleSprayChart}
                                p="xs"
                                mt="xs"
                            >
                                <Group justify="center" gap="xs">
                                    <Text size="sm" c="blue.2" fw={500}>
                                        {sprayChartOpened
                                            ? "Hide Spray Chart"
                                            : "See Spray Chart"}
                                    </Text>
                                    {sprayChartOpened ? (
                                        <IconChevronUp
                                            size={16}
                                            color="var(--mantine-color-blue-2)"
                                        />
                                    ) : (
                                        <IconChevronDown
                                            size={16}
                                            color="var(--mantine-color-blue-2)"
                                        />
                                    )}
                                </Group>
                            </UnstyledButton>
                            <Collapse in={sprayChartOpened}>
                                <MiniSprayChart hits={hits} />
                            </Collapse>
                        </>
                    )}
                </Stack>
            )}
        </Card>
    );
}
