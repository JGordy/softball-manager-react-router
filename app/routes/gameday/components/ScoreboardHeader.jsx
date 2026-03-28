import { Card, Group, Text, Stack, Box, Badge } from "@mantine/core";

import StatusBadge from "@/components/StatusBadge";

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

export default function ScoreboardHeader({
    score,
    opponentScore,
    inning,
    halfInning,
    outs,
    teamName,
    opponentName,
    gameFinal = false,
    realtimeStatus = "connecting",
    runners = { first: false, second: false, third: false },
}) {
    return (
        <Card withBorder p={{ base: "md", lg: "sm" }} radius="lg">
            <Group justify="space-between" align="center">
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
                            <Badge size="xs" color="blue">
                                {halfInning.toUpperCase()} {inning}
                            </Badge>

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

                            <Group
                                gap={4}
                                aria-label={`${outs} ${outs === 1 ? "out" : "outs"}`}
                            >
                                <Box
                                    w={8}
                                    h={8}
                                    style={{
                                        borderRadius: "50%",
                                        backgroundColor:
                                            outs >= 1
                                                ? "var(--mantine-color-orange-filled)"
                                                : "var(--mantine-color-gray-3)",
                                        opacity: outs >= 1 ? 1 : 0.3,
                                    }}
                                />
                                <Box
                                    w={8}
                                    h={8}
                                    style={{
                                        borderRadius: "50%",
                                        backgroundColor:
                                            outs >= 2
                                                ? "var(--mantine-color-red-filled)"
                                                : "var(--mantine-color-gray-3)",
                                        opacity: outs >= 2 ? 1 : 0.3,
                                    }}
                                />
                                <Text size="xs" c="dimmed" ml={4} fw={700}>
                                    {outs} {outs === 1 ? "OUT" : "OUTS"}
                                </Text>
                            </Group>
                        </>
                    )}
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

            <Box mt={{ base: 12, lg: 6 }}>
                <Group justify="center">
                    <StatusBadge status={realtimeStatus} />
                </Group>
            </Box>
        </Card>
    );
}
