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

export const ParkLeaderboard = ({ topParks }) => {
    if (!topParks || topParks.length === 0) return null;

    const maxGames = Math.max(...topParks.map((p) => p.gameCount));

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                <Group justify="space-between">
                    <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                            Park Activity
                        </Text>
                        <Title order={3}>Field Hubs</Title>
                    </Stack>
                </Group>

                <Table withRowBorders={false} verticalSpacing="xs">
                    <Table.Tbody>
                        {topParks.map((park) => (
                            <Table.Tr key={park.id}>
                                <Table.Td p={0}>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm" fw={500}>
                                            {park.name}
                                        </Text>
                                        <Badge
                                            color="orange"
                                            variant="light"
                                            size="xs"
                                        >
                                            {park.gameCount} games
                                        </Badge>
                                    </Group>
                                    <Progress
                                        value={
                                            (park.gameCount / maxGames) * 100
                                        }
                                        size="xs"
                                        radius="xl"
                                        color="orange"
                                        mb="sm"
                                    />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Stack>
        </Paper>
    );
};
