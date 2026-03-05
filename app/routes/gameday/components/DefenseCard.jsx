import { Badge, Card, Divider, Group, Stack, Text } from "@mantine/core";

export default function DefenseCard({ teamName, dueUpBatters }) {
    return (
        <>
            <Card withBorder p="sm" radius="md">
                <Stack gap={0}>
                    <Text size="xs" fw={700} c="dimmed">
                        ON DEFENSE
                    </Text>
                    <Text size="lg" fw={800}>
                        {teamName}
                    </Text>
                </Stack>
                {dueUpBatters?.length > 0 && (
                    <Stack gap={4} mt="sm">
                        <Divider mb="md" />
                        <Text size="xs" fw={700} c="dimmed">
                            DUE UP
                        </Text>
                        <Group justify="space-between" gap="md">
                            {dueUpBatters.map((batter, index) => (
                                <Badge
                                    key={batter.$id || index}
                                    size="lg"
                                    fw={600}
                                    variant="filled"
                                    color="blue"
                                >
                                    {index + 1}. {batter.firstName}{" "}
                                    {batter.lastName?.charAt(0)}.
                                </Badge>
                            ))}
                        </Group>
                    </Stack>
                )}
            </Card>
        </>
    );
}
