import { Card, Group, Stack, Text, Box, Badge, Divider } from "@mantine/core";
import { IconCaretUpFilled, IconCaretDownFilled } from "@tabler/icons-react";

import StatusBadge from "@/components/StatusBadge";

import DiamondView from "./DiamondView";
import CurrentBatterCard from "./CurrentBatterCard";
import UpNextCard from "./UpNextCard";

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
    runners,
    currentBatter,
    upcomingBatters,
    logs,
}) {
    return (
        <Card withBorder p="md" radius="lg">
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
                                <Box
                                    style={{
                                        transform: "scale(0.35)",
                                        transformOrigin: "center",
                                        margin: "-60px 0 -55px 0",
                                    }}
                                >
                                    <DiamondView
                                        runners={runners}
                                        withTitle={false}
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
                                    <Box
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            backgroundColor:
                                                outs >= 1
                                                    ? "var(--mantine-color-red-filled)"
                                                    : "var(--mantine-color-gray-4)",
                                        }}
                                    />
                                    <Box
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            backgroundColor:
                                                outs >= 2
                                                    ? "var(--mantine-color-red-filled)"
                                                    : "var(--mantine-color-gray-4)",
                                        }}
                                    />
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

                <Divider />

                {/* Batting Information */}
                {!gameFinal && (
                    <Stack gap="xs">
                        {isOurBatting && (
                            <>
                                <CurrentBatterCard
                                    currentBatter={currentBatter}
                                    logs={logs}
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
