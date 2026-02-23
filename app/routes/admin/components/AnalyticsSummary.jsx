import { Paper, SimpleGrid, Text, Title } from "@mantine/core";

export const AnalyticsSummary = ({ umami, range = "24h" }) => {
    if (!umami) return <Text c="red">Failed to load Umami data</Text>;

    const rangeLabel = range === "24h" ? "24h" : range === "7d" ? "7d" : "30d";

    const metrics = [
        {
            label: "Page Views",
            value: (
                umami.pageviews?.value ??
                umami.pageviews ??
                0
            ).toLocaleString(),
        },
        {
            label: "Unique Visitors",
            value: (
                umami.visitors?.value ??
                umami.visitors ??
                0
            ).toLocaleString(),
        },
        {
            label: "Bounces",
            value: (
                umami.bounces?.value ??
                umami.bounces ??
                0
            ).toLocaleString(),
        },
        {
            label: "Total Time",
            value: `${Math.round((umami.totaltime?.value ?? umami.totaltime ?? 0) / 60)} min`,
        },
    ];

    return (
        <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">
                Umami Analytics ({rangeLabel})
            </Title>
            <SimpleGrid cols={{ base: 2, md: 4 }}>
                {metrics.map((m) => (
                    <div key={m.label}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                            {m.label}
                        </Text>
                        <Title order={2}>{m.value}</Title>
                    </div>
                ))}
            </SimpleGrid>
        </Paper>
    );
};
