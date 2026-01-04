import { Card, Stack, Text } from "@mantine/core";

export default function DefenseCard({ teamName }) {
    return (
        <Card withBorder p="sm" radius="md">
            <Stack gap={0}>
                <Text size="xs" fw={700} c="dimmed">
                    ON DEFENSE
                </Text>
                <Text size="lg" fw={800}>
                    {teamName}
                </Text>
            </Stack>
        </Card>
    );
}
