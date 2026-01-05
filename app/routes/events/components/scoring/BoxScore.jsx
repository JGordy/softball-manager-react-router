import { useMemo } from "react";
import { Table, ScrollArea, Text, Card } from "@mantine/core";
import { calculateGameStats, calculateTeamTotals } from "@/utils/stats";

export default function BoxScore({ logs, playerChart, currentBatter }) {
    const { stats, totals } = useMemo(() => {
        const stats = calculateGameStats(logs, playerChart);
        const totals = calculateTeamTotals(stats);
        return { stats, totals };
    }, [logs, playerChart]);

    const rows = stats.map((stat) => {
        const isCurrentBatter =
            currentBatter && stat.player.$id === currentBatter.$id;

        return (
            <Table.Tr
                key={stat.player.$id}
                bg={
                    isCurrentBatter
                        ? "var(--mantine-color-blue-light)"
                        : undefined
                }
            >
                <Table.Td>
                    <Text size="sm" fw={isCurrentBatter ? 700 : 500}>
                        {stat.player.firstName} {stat.player.lastName.charAt(0)}
                        .
                    </Text>
                </Table.Td>
                <Table.Td ta="center">{stat.AB}</Table.Td>
                <Table.Td ta="center">{stat.H}</Table.Td>
                <Table.Td ta="center">{stat.RBI}</Table.Td>
                <Table.Td ta="center">{stat.R}</Table.Td>
                <Table.Td ta="center">{stat.HR}</Table.Td>
                <Table.Td ta="center">{stat.BB}</Table.Td>
                <Table.Td ta="center">{stat.K}</Table.Td>
                <Table.Td ta="center" fw={700}>
                    {stat.AVG}
                </Table.Td>
                <Table.Td ta="center" c="dimmed">
                    {stat.OBP}
                </Table.Td>
                <Table.Td ta="center" c="dimmed">
                    {stat.OPS}
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Card p={0} withBorder radius="md">
            <ScrollArea>
                <Table striped highlightOnHover verticalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Batter</Table.Th>
                            <Table.Th ta="center" w={50}>
                                AB
                            </Table.Th>
                            <Table.Th ta="center" w={50}>
                                H
                            </Table.Th>
                            <Table.Th ta="center" w={50}>
                                RBI
                            </Table.Th>
                            <Table.Th ta="center" w={50}>
                                R
                            </Table.Th>
                            <Table.Th ta="center" w={50}>
                                HR
                            </Table.Th>
                            <Table.Th ta="center" w={50}>
                                BB
                            </Table.Th>
                            <Table.Th ta="center" w={50}>
                                K
                            </Table.Th>
                            <Table.Th ta="center" w={70}>
                                AVG
                            </Table.Th>
                            <Table.Th ta="center" w={70}>
                                OBP
                            </Table.Th>
                            <Table.Th ta="center" w={70}>
                                OPS
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                    <Table.Tfoot>
                        <Table.Tr fw={700}>
                            <Table.Td>TOTALS</Table.Td>
                            <Table.Td ta="center">{totals.AB}</Table.Td>
                            <Table.Td ta="center">{totals.H}</Table.Td>
                            <Table.Td ta="center">{totals.RBI}</Table.Td>
                            <Table.Td ta="center">{totals.R}</Table.Td>
                            <Table.Td ta="center">{totals.HR}</Table.Td>
                            <Table.Td ta="center">{totals.BB}</Table.Td>
                            <Table.Td ta="center">{totals.K}</Table.Td>
                            <Table.Td ta="center">{totals.AVG}</Table.Td>
                            <Table.Td ta="center">{totals.OBP}</Table.Td>
                            <Table.Td ta="center">{totals.OPS}</Table.Td>
                        </Table.Tr>
                    </Table.Tfoot>
                </Table>
            </ScrollArea>
        </Card>
    );
}
