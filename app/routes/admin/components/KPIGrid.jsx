import {
    Group,
    Indicator,
    Paper,
    Grid,
    Text,
    Title,
    Stack,
} from "@mantine/core";

export const KPIGrid = ({ stats }) => {
    const kpis = [
        { label: "Users", value: stats.totalUsers },
        { label: "Teams", value: stats.totalTeams },
        { label: "Games", value: stats.totalGames },
        {
            label: "Online",
            value: stats.activeUsers,
            isLive: true,
        },
    ];

    return (
        <Grid mb="xl" gutter="xs">
            {kpis.map((kpi) => (
                <Grid.Col key={kpi.label} span={3}>
                    <Paper
                        withBorder
                        p="xs"
                        radius="md"
                        h="100%"
                        pos="relative"
                    >
                        {kpi.isLive && (
                            <Indicator
                                color={kpi.value > 0 ? "red" : "gray"}
                                processing={kpi.value > 0}
                                size={6}
                                pos="absolute"
                                top={10}
                                right={10}
                            />
                        )}
                        <Stack gap={2} align="center">
                            <Text
                                size="xs"
                                c="dimmed"
                                fw={700}
                                tt="uppercase"
                                ta="center"
                                style={{
                                    lineHeight: 1.1,
                                    width: "100%",
                                }}
                            >
                                {kpi.label}
                            </Text>
                            <Title
                                order={3}
                                ta="center"
                                style={{
                                    fontSize: "var(--mantine-font-size-lg)",
                                }}
                            >
                                {kpi.value.toLocaleString()}
                            </Title>
                        </Stack>
                    </Paper>
                </Grid.Col>
            ))}
        </Grid>
    );
};
