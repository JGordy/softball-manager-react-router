import { Button, Group, Stack, Table, Text } from "@mantine/core";
import { Link } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import { DateTime } from "luxon";

import DrawerContainer from "@/components/DrawerContainer";
import { calculatePlayerStats } from "@/utils/stats";

export default function StatsDetailDrawer({ opened, onClose, game, logs }) {
    const isDesktop = useMediaQuery("(min-width: 62em)");

    if (!game) return null;

    const stats = calculatePlayerStats(logs || []);
    const { details } = stats;

    const date = DateTime.fromISO(game.gameDate).toLocaleString(
        DateTime.DATE_FULL,
    );

    const rows = [
        { label: "At Bats", value: stats.ab },
        { label: "Hits", value: stats.hits },
        { label: "Singles", value: details["1B"] },
        { label: "Doubles", value: details["2B"] },
        { label: "Triples", value: details["3B"] },
        { label: "Home Runs", value: details.HR },
        { label: "RBI", value: details.RBI },
        { label: "Walks", value: details.BB },
        { label: "Sac Flies", value: details.SF },
        { label: "Errors (Reached On)", value: details.E },
        { label: "Fielder's Choice", value: details.FC },
    ];

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title={`${game.team?.name} vs ${game.opponent || "Opponent"}`}
            position={isDesktop ? "right" : "bottom"}
            size={isDesktop ? "md" : "xl"}
            padding="md"
        >
            <Stack gap="lg">
                <Text size="sm" c="dimmed" ta="center">
                    {date}
                </Text>

                <Group justify="center" my="xs">
                    <Text fw={700} size="2rem" lh={1}>
                        {stats.hits} for {stats.ab}
                    </Text>
                </Group>

                <Group grow>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            AVG
                        </Text>
                        <Text fw={700} size="lg">
                            {stats.calculated.avg}
                        </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            OBP
                        </Text>
                        <Text fw={700} size="lg">
                            {stats.calculated.obp}
                        </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            SLG
                        </Text>
                        <Text fw={700} size="lg">
                            {stats.calculated.slg}
                        </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            OPS
                        </Text>
                        <Text fw={700} size="lg">
                            {stats.calculated.ops}
                        </Text>
                    </Stack>
                </Group>

                <Table striped highlightOnHover>
                    <Table.Tbody>
                        {rows.map((row) => (
                            <Table.Tr key={row.label}>
                                <Table.Td>{row.label}</Table.Td>
                                <Table.Td
                                    style={{
                                        textAlign: "right",
                                        fontWeight: 700,
                                    }}
                                >
                                    {row.value}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>

                <Button
                    component={Link}
                    to={`/events/${game.$id}?open=awards`}
                    variant="light"
                    fullWidth
                    mt="md"
                >
                    See Game Details
                </Button>
            </Stack>
        </DrawerContainer>
    );
}
