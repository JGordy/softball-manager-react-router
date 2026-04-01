import { Stack, Group, Skeleton, Table } from "@mantine/core";

export default function LineupLoadingSkeleton() {
    return (
        <Stack gap="md" data-testid="lineup-skeleton">
            <Table withColumnBorders withTableBorder verticalSpacing="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th style={{ width: 40 }} />
                        <Table.Th style={{ width: 40 }}>#</Table.Th>
                        <Table.Th>Player</Table.Th>
                        <Table.Th style={{ width: 100 }}>Pos</Table.Th>
                        <Table.Th style={{ width: 100 }}>Innings</Table.Th>
                        <Table.Th style={{ width: 60 }} />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {[...Array(12)].map((_, i) => (
                        <Table.Tr key={i}>
                            <Table.Td>
                                <Skeleton height={20} circle />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width={20} />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width="60%" />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width={80} />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width={80} />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width={20} />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
            <Group justify="center" mt="xl">
                <Skeleton height={42} width={200} radius="md" />
            </Group>
        </Stack>
    );
}
