import {
    Badge,
    Group,
    Paper,
    RingProgress,
    Stack,
    Table,
    Text,
    Title,
} from "@mantine/core";

/** Emoji prefix for each known notification type */
const TYPE_EMOJI = {
    lineup_finalized: "📋",
    team_announcement: "📣",
    gametime_reminder: "⏰",
};

/**
 * Returns a Mantine color token for a given delivery success rate.
 *
 * @param {number} successRate - 0–100
 * @returns {string} Mantine color name
 */
function ringColor(successRate) {
    if (successRate >= 90) return "lime";
    if (successRate >= 70) return "orange";
    return "red";
}

/**
 * Displays push notification health metrics: total volume, delivery success
 * rate (RingProgress), and a type breakdown table showing counts + percentages
 * derived from the most recent sample of messages.
 *
 * @param {{ stats: {
 *   total: number,
 *   sampleSize: number,
 *   failedInSample: number,
 *   failRate: number,
 *   byType: Array<{type: string, label: string, count: number}>
 * }}} props
 * @returns {JSX.Element|null}
 */
export const NotificationHealth = ({ stats }) => {
    if (!stats) return null;

    const { total, sampleSize, failedInSample, failRate, byType } = stats;
    const successRate = 100 - failRate;

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="md">
                {/* Header: title + ring progress */}
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Title order={3}>
                            {total.toLocaleString()} Notifications Sent
                        </Title>
                        <Text size="xs" c="dimmed" mt={2}>
                            Based on last {sampleSize} messages
                        </Text>
                    </Stack>

                    <Stack gap={2} align="center">
                        <RingProgress
                            size={80}
                            thickness={8}
                            roundCaps
                            sections={[
                                {
                                    value: successRate,
                                    color: ringColor(successRate),
                                },
                            ]}
                            label={
                                <Text ta="center" fw={700} size="xs">
                                    {successRate}%
                                </Text>
                            }
                        />
                        <Text size="xs" c="dimmed">
                            delivered
                        </Text>
                    </Stack>
                </Group>

                {/* Type breakdown table */}
                <Stack gap={4}>
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                            By Type
                        </Text>
                        <Badge
                            color={failedInSample === 0 ? "lime" : "red"}
                            variant="light"
                            size="xs"
                        >
                            {failedInSample} failed in sample
                        </Badge>
                    </Group>

                    <Table withRowBorders={false} verticalSpacing={4}>
                        <Table.Tbody>
                            {byType.map(({ type, label, count }) => {
                                const pct =
                                    sampleSize > 0
                                        ? Math.round((count / sampleSize) * 100)
                                        : 0;
                                return (
                                    <Table.Tr key={type}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Text>
                                                    {TYPE_EMOJI[type] ?? "📩"}
                                                </Text>
                                                <Text size="sm">{label}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                variant="light"
                                                color="gray"
                                                size="xs"
                                            >
                                                {count}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {pct}%
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Stack>
        </Paper>
    );
};
