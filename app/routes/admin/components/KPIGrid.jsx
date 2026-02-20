import {
    Group,
    Indicator,
    Paper,
    SimpleGrid,
    Text,
    Title,
} from "@mantine/core";

export const KPIGrid = ({ stats }) => {
    const kpis = [
        { label: "Total Users", value: stats.totalUsers, color: "blue" },
        { label: "Total Teams", value: stats.totalTeams, color: "green" },
        { label: "Total Games", value: stats.totalGames, color: "orange" },
        {
            label: "Live Visitors",
            value: stats.activeUsers,
            color: "red",
            isLive: true,
        },
    ];

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
            {kpis.map((kpi) => (
                <Paper key={kpi.label} withBorder p="md" radius="md">
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                            {kpi.label}
                        </Text>
                        {kpi.isLive && (
                            <Indicator
                                color={kpi.value > 0 ? "red" : "gray"}
                                processing={kpi.value > 0}
                                size={10}
                            />
                        )}
                    </Group>
                    <Group align="flex-end" gap="xs" mt={10}>
                        <Title order={2}>{kpi.value.toLocaleString()}</Title>
                    </Group>
                </Paper>
            ))}
        </SimpleGrid>
    );
};
