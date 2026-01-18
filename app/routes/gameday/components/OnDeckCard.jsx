import { Card, Group, Text } from "@mantine/core";

export default function OnDeckCard({ onDeckBatter }) {
    if (!onDeckBatter) return null;

    return (
        <Card withBorder p="xs" radius="md" bg="var(--mantine-color-body)">
            <Group justify="space-between" gap="xs">
                <Text size="xs" fw={600} c="dimmed">
                    ON DECK
                </Text>
                <Text size="sm" fw={600}>
                    {onDeckBatter.firstName} {onDeckBatter.lastName}
                </Text>
            </Group>
        </Card>
    );
}
