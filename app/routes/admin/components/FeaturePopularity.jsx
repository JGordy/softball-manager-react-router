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

export const FeaturePopularity = ({ topFeatures }) => {
    if (!topFeatures || topFeatures.length === 0) return null;

    const maxViews = Math.max(...topFeatures.map((f) => f.views));

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Feature Popularity (Umami)
                </Text>
                <Title order={3}>Top Features</Title>

                <Table withRowBorders={false} verticalSpacing="xs">
                    <Table.Tbody>
                        {topFeatures.map((feature) => (
                            <Table.Tr key={feature.name}>
                                <Table.Td p={0}>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm" fw={500}>
                                            {feature.name}
                                        </Text>
                                        <Badge variant="outline" size="xs">
                                            {feature.views.toLocaleString()}{" "}
                                            visits
                                        </Badge>
                                    </Group>
                                    <Progress
                                        value={(feature.views / maxViews) * 100}
                                        size="sm"
                                        radius="xl"
                                        color="blue"
                                        mb="md"
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
