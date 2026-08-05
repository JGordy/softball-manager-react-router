import {
    Badge,
    Group,
    Paper,
    Progress,
    Stack,
    Table,
    Text,
    Title,
} from "@mantine/core";
import { IconActivity } from "@tabler/icons-react";

/** Maps event types to Mantine color tokens */
const EVENT_COLORS = {
    single: "lime",
    double: "blue",
    triple: "grape",
    homerun: "yellow",
    walk: "cyan",
    strikeout: "red",
    ground_out: "orange",
    fly_out: "orange",
    line_out: "orange",
    pop_out: "orange",
    error: "pink",
    opponent_run: "gray",
};

/**
 * Displays a breakdown of live scoring events logged during games, including
 * total plays logged, average per game, and percentage distribution by type.
 *
 * @param {{ logsStats: {
 *   total: number,
 *   sampleSize: number,
 *   avgPerGame: string,
 *   byType: Array<{type: string, label: string, count: number, percentage: number}>
 * }}} props
 * @returns {JSX.Element|null}
 */
export const GameLogsBreakdown = ({ logsStats }) => {
    if (!logsStats) return null;

    const { total = 0, avgPerGame = "0", byType = [] } = logsStats;

    return (
        <Paper withBorder p="md" radius="md" mb="xl">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Title order={3}>Play-by-Play Logs</Title>
                        <Text size="xs" c="dimmed" mt={2}>
                            {total.toLocaleString()} total logged events (
                            {avgPerGame} per game)
                        </Text>
                    </Stack>
                    <Badge
                        variant="light"
                        color="lime"
                        size="sm"
                        leftSection={<IconActivity size={12} />}
                    >
                        {total.toLocaleString()} events
                    </Badge>
                </Group>

                {byType.length > 0 ? (
                    <Stack gap="xs">
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                            Team Event Distribution (All-Time)
                        </Text>
                        <Table withRowBorders={false} verticalSpacing={4}>
                            <Table.Tbody>
                                {byType.map(
                                    ({ type, label, count, percentage }) => (
                                        <Table.Tr key={type}>
                                            <Table.Td p={0}>
                                                <Group
                                                    justify="space-between"
                                                    mb={2}
                                                >
                                                    <Text size="sm" fw={500}>
                                                        {label}
                                                    </Text>
                                                    <Group gap="xs">
                                                        <Badge
                                                            variant="light"
                                                            color={
                                                                EVENT_COLORS[
                                                                    type
                                                                ] || "gray"
                                                            }
                                                            size="xs"
                                                        >
                                                            {count}
                                                        </Badge>
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                            style={{
                                                                width: 36,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            {percentage}%
                                                        </Text>
                                                    </Group>
                                                </Group>
                                                <Progress
                                                    value={percentage}
                                                    size="xs"
                                                    radius="xl"
                                                    color={
                                                        EVENT_COLORS[type] ||
                                                        "gray"
                                                    }
                                                    mb="xs"
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                    ),
                                )}
                            </Table.Tbody>
                        </Table>
                    </Stack>
                ) : (
                    <Text size="sm" c="dimmed">
                        No play-by-play events recorded yet.
                    </Text>
                )}
            </Stack>
        </Paper>
    );
};
