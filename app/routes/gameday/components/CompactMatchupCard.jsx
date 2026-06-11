import { Card, Group, Stack, Text, Box, Badge, Divider } from "@mantine/core";
import { IconCaretUpFilled, IconCaretDownFilled } from "@tabler/icons-react";

import StatusBadge from "@/components/StatusBadge";

import CurrentBatterCard from "./CurrentBatterCard";
import UpNextCard from "./UpNextCard";

/**
 * A compact base component representing a single base on the diamond.
 *
 * @param {object} props - Component props
 * @param {boolean} props.active - Whether the base has a runner on it
 * @param {object} props.style - CSS overrides for positioning
 * @param {string} props.label - ARIA label for accessibility
 */
function Base({ active, style, label }) {
    return (
        <Box
            aria-label={label}
            style={{
                width: 10,
                height: 10,
                backgroundColor: active
                    ? "var(--mantine-color-blue-filled)"
                    : "var(--mantine-color-gray-3)",
                border: "1px solid var(--mantine-color-gray-5)",
                position: "absolute",
                zIndex: 2,
                opacity: active ? 1 : 0.4,
                ...style,
            }}
        />
    );
}

export default function CompactMatchupCard({
    score,
    opponentScore,
    inning,
    halfInning,
    outs,
    teamName,
    opponentName,
    gameFinal = false,
    realtimeStatus = "connecting",
    isOurBatting,
    runners = { first: false, second: false, third: false },
    currentBatter,
    upcomingBatters,
    logs,
    opponentScoringMode,
    onOpponentNotesChange,
    splitBatter = false,
    ...props
}) {
    return (
        <Card p="md" radius="lg" {...props}>
            <Stack gap="md">
                {/* Scoreboard Row */}
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Stack gap={0} align="center" style={{ flex: 1 }}>
                        <Text size="xs" fw={700} c="dimmed" ta="center">
                            {teamName}
                        </Text>
                        <Text size="xl" fw={900}>
                            {score}
                        </Text>
                    </Stack>

                    <Stack gap={0} align="center" style={{ flex: 1 }}>
                        {gameFinal ? (
                            <Badge color="gray" size="lg" variant="filled">
                                FINAL
                            </Badge>
                        ) : (
                            <>
                                {/* Compact Diamond */}
                                <Box
                                    pos="relative"
                                    w={40}
                                    h={28}
                                    mt="xs"
                                    aria-label="Runner status"
                                >
                                    <Base
                                        active={runners.second}
                                        label="Second base"
                                        style={{
                                            top: 0,
                                            left: "50%",
                                            transform:
                                                "translateX(-50%) rotate(45deg)",
                                        }}
                                    />
                                    <Base
                                        active={runners.third}
                                        label="Third base"
                                        style={{
                                            top: 10,
                                            left: 6,
                                            transform: "rotate(45deg)",
                                        }}
                                    />
                                    <Base
                                        active={runners.first}
                                        label="First base"
                                        style={{
                                            top: 10,
                                            right: 6,
                                            transform: "rotate(45deg)",
                                        }}
                                    />
                                </Box>
                                <Group gap={2} justify="center" mt="sm">
                                    <Text fw={700} size="sm">
                                        {inning}
                                    </Text>
                                    {halfInning === "top" ? (
                                        <IconCaretUpFilled
                                            size={14}
                                            color="var(--mantine-color-blue-filled)"
                                        />
                                    ) : (
                                        <IconCaretDownFilled
                                            size={14}
                                            color="var(--mantine-color-blue-filled)"
                                        />
                                    )}
                                </Group>
                                <Group gap={4} mb={4}>
                                    {[1, 2].map((dotOuts) => (
                                        <Box
                                            key={dotOuts}
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                backgroundColor:
                                                    outs >= dotOuts
                                                        ? "var(--mantine-color-red-filled)"
                                                        : "var(--mantine-color-gray-4)",
                                            }}
                                        />
                                    ))}
                                </Group>
                            </>
                        )}
                        <StatusBadge status={realtimeStatus} />
                    </Stack>

                    <Stack gap={0} align="center" style={{ flex: 1 }}>
                        <Text size="xs" fw={700} c="dimmed" ta="center">
                            {opponentName || "Opponent"}
                        </Text>
                        <Text size="xl" fw={900}>
                            {opponentScore}
                        </Text>
                    </Stack>
                </Group>

                {!splitBatter && <Divider />}

                {/* Batting Information */}
                {!splitBatter && !gameFinal && (
                    <Stack gap="xs">
                        {(isOurBatting ||
                            opponentScoringMode === "Detailed") && (
                            <>
                                <CurrentBatterCard
                                    currentBatter={currentBatter}
                                    logs={logs}
                                    isOpponent={!isOurBatting}
                                    onNotesChange={
                                        !isOurBatting
                                            ? onOpponentNotesChange
                                            : undefined
                                    }
                                    p="sm"
                                />
                                <UpNextCard
                                    upcomingBatters={upcomingBatters}
                                    p="sm"
                                />
                            </>
                        )}
                    </Stack>
                )}
            </Stack>
        </Card>
    );
}
