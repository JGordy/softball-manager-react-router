import { Stack, Card, Group, Skeleton } from "@mantine/core";

export default function GamedayLoadingSkeleton() {
    return (
        <Stack gap="md">
            {/* Scoreboard */}
            <Card withBorder radius="lg" p="md">
                <Group justify="space-between">
                    <Skeleton height={60} width={100} />
                    <Stack gap="xs" align="center">
                        <Skeleton height={24} width={60} />
                        <Skeleton height={16} width={80} />
                    </Stack>
                    <Skeleton height={60} width={100} />
                </Group>
            </Card>

            {/* Tabs */}
            <Group gap="xs" mb="xs" justify="center">
                <Skeleton height={32} width={80} radius="md" />
                <Skeleton height={32} width={80} radius="md" />
                <Skeleton height={32} width={100} radius="md" />
            </Group>

            {/* Current Batter Card */}
            <Card withBorder radius="lg" p="md">
                <Skeleton height={40} width="60%" />
            </Card>

            {/* Main Content Area */}
            <Group align="start" gap="xl" wrap="nowrap">
                {/* Diamond and Last Play */}
                <Stack gap="sm" style={{ width: 180 }}>
                    <Skeleton height={180} width={180} radius="lg" />
                    <Skeleton height={100} radius="lg" />
                </Stack>

                {/* Action Pad */}
                <Stack style={{ flex: 1 }} gap="xs">
                    <Skeleton height={20} width={80} mb="xs" />
                    <Group gap="xs">
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                    </Group>
                    <Group gap="xs">
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                    </Group>
                    <Group gap="xs">
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                    </Group>
                    <Skeleton height={20} width={80} mt="sm" mb="xs" />
                    <Group gap="xs">
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                    </Group>
                    <Group gap="xs">
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                    </Group>
                    <Group gap="xs">
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                        <Skeleton height={50} style={{ flex: 1 }} radius="md" />
                    </Group>
                </Stack>
            </Group>
        </Stack>
    );
}
