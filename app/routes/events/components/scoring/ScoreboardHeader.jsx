import { Card, Group, Text, Stack, Box, Badge } from "@mantine/core";
import {
    IconCaretUpFilled,
    IconCaretDownFilled,
    IconBroadcast,
    IconBroadcastOff,
} from "@tabler/icons-react";

const StatusBadge = ({ status }) => {
    const statusProps = {
        connected: {
            color: "blue",
            leftSection: <IconBroadcast size={12} />,
            className: "live-pulse",
            style: { textTransform: "none" },
            children: "Live",
        },
        connecting: {
            color: "gray",
            children: "Syncing...",
        },
        error: {
            color: "orange",
            leftSection: <IconBroadcastOff size={12} />,
            children: "Offline",
        },
        idle: {
            style: { display: "none" },
        },
    };

    const badgeProps = status
        ? statusProps[status] || {}
        : { style: { visibility: "hidden" } };

    const { style: statusStyle, ...restBadgeProps } = badgeProps;

    return (
        <Badge
            variant="light"
            size="sm"
            style={{ textTransform: "none", ...(statusStyle || {}) }}
            {...restBadgeProps}
        />
    );
};

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
}) {
    return (
        <Card withBorder p="md" radius="lg">
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
                            <Group
                                gap={4}
                                aria-label={
                                    halfInning === "top"
                                        ? "Top of inning"
                                        : "Bottom of inning"
                                }
                            >
                                {halfInning === "top" ? (
                                    <IconCaretUpFilled
                                        size={16}
                                        color="var(--mantine-color-blue-filled)"
                                    />
                                ) : (
                                    <IconCaretDownFilled
                                        size={16}
                                        color="var(--mantine-color-blue-filled)"
                                    />
                                )}
                                <Text fw={700}>{inning}</Text>
                            </Group>
                            <Group gap={2} aria-label={`${outs} outs`}>
                                <Box
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        backgroundColor:
                                            outs >= 1
                                                ? "var(--mantine-color-red-filled)"
                                                : "#eee",
                                    }}
                                />
                                <Box
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        backgroundColor:
                                            outs >= 2
                                                ? "var(--mantine-color-red-filled)"
                                                : "#eee",
                                    }}
                                />
                                <Text size="xs" c="dimmed" ml={4}>
                                    OUTS
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
            <Box mt={12}>
                <Group justify="center">
                    <StatusBadge status={realtimeStatus} />
                </Group>
            </Box>
        </Card>
    );
}
