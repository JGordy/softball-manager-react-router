import {
    Badge,
    Group,
    Paper,
    Progress,
    RingProgress,
    Stack,
    Text,
    Title,
} from "@mantine/core";

export const AILineupMetrics = ({ aiLineupMetrics, range = "24h" }) => {
    if (!aiLineupMetrics) return null;

    const { requested, generated, applied } = aiLineupMetrics;

    // Use the maximum value as the base for the ring to ensure segments sum to 100%
    const totalBase = Math.max(requested, generated, applied, 0);
    const hasActivity = totalBase > 0;

    const generationRate =
        requested > 0 ? Math.round((generated / requested) * 100) : 0;
    const applicationRate =
        generated > 0 ? Math.round((applied / generated) * 100) : 0;
    const overallSuccessRate =
        requested > 0 ? Math.round((applied / requested) * 100) : 0;

    const rangeLabel = range === "24h" ? "24h" : range === "7d" ? "7d" : "30d";

    const ringSections = hasActivity
        ? [
              {
                  value: (applied / totalBase) * 100,
                  color: "cyan",
                  tooltip: `Applied: ${applied}`,
              },
              {
                  value: (Math.max(0, generated - applied) / totalBase) * 100,
                  color: "grape",
                  tooltip: `Generated (Unused): ${generated - applied}`,
              },
              {
                  value: (Math.max(0, totalBase - generated) / totalBase) * 100,
                  color: "indigo",
                  tooltip: `Pending/Failed: ${Math.max(0, totalBase - generated)}`,
              },
          ]
        : [
              {
                  value: 100,
                  color: "gray.2",
                  tooltip: "No activity in this period",
              },
          ];

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    AI Lineup Activity ({rangeLabel})
                </Text>

                <Group justify="space-between" align="center" wrap="nowrap">
                    <Stack gap={0}>
                        <Title order={3}>Lineup Funnel</Title>
                        <Text size="sm" c="dimmed" mt={4}>
                            {overallSuccessRate}% of all requests resulting in
                            lineups used.
                        </Text>
                    </Stack>
                    <RingProgress
                        size={100}
                        thickness={10}
                        roundCaps
                        sections={ringSections}
                        label={
                            <Text ta="center" fw={700} size="sm">
                                {overallSuccessRate}%
                            </Text>
                        }
                    />
                </Group>

                <Stack gap="md" mt="xs">
                    <div>
                        <Group justify="space-between" mb={4}>
                            <Text size="sm" fw={500}>
                                Request Pipeline
                            </Text>
                            <Badge
                                variant="gradient"
                                gradient={{
                                    from: "indigo",
                                    to: "grape",
                                    deg: 45,
                                }}
                                size="xs"
                            >
                                {generationRate}% SUCCESS
                            </Badge>
                        </Group>
                        <Progress
                            value={Math.min(generationRate, 100)}
                            size="sm"
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: "indigo", to: "grape", deg: 45 }}
                        />
                        <Text size="xs" c="dimmed" mt={4}>
                            {generated} lineups created from {requested}{" "}
                            requests
                        </Text>
                    </div>

                    <div>
                        <Group justify="space-between" mb={4}>
                            <Text size="sm" fw={500}>
                                Application Funnel
                            </Text>
                            <Badge
                                variant="gradient"
                                gradient={{
                                    from: "grape",
                                    to: "cyan",
                                    deg: 45,
                                }}
                                size="xs"
                            >
                                {applicationRate}% APPLIED
                            </Badge>
                        </Group>
                        <Progress
                            value={Math.min(applicationRate, 100)}
                            size="sm"
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: "grape", to: "cyan", deg: 45 }}
                        />
                        <Text size="xs" c="dimmed" mt={4}>
                            {applied} of {generated} suggestions used by
                            managers
                        </Text>
                    </div>
                </Stack>

                <Group mt="md" gap="xs">
                    <Badge variant="outline" color="indigo" size="xs">
                        {requested} Requests
                    </Badge>
                    <Badge variant="outline" color="grape" size="xs">
                        {generated} Generated
                    </Badge>
                    <Badge variant="outline" color="cyan" size="xs">
                        {applied} Applied
                    </Badge>
                </Group>
            </Stack>
        </Paper>
    );
};
