import { Stack, Card, Group, Skeleton, Box } from "@mantine/core";
import DesktopGamedayLoadingSkeleton from "./DesktopGamedayLoadingSkeleton";

export function MobileGamedayLoadingSkeleton() {
    return (
        <Stack gap="md" mt="md">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Skeleton height={36} width={64} radius="md" />
                <Skeleton height={32} width={140} radius="sm" />
                <Skeleton height={32} width={32} radius="xl" />
            </Group>

            {/* Scoreboard */}
            <Card withBorder radius="lg" p="md">
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Stack gap={0} align="center" style={{ flex: 1 }}>
                        <Skeleton height={10} width={40} mb={4} />
                        <Skeleton height={32} width={30} />
                    </Stack>

                    <Stack gap="xs" align="center" style={{ flex: 1 }}>
                        {/* Inning Badge */}
                        <Skeleton height={18} width={60} radius="sm" />

                        {/* Compact Diamond */}
                        <Box pos="relative" w={40} h={28} mt={4}>
                            <Skeleton
                                height={10}
                                width={10}
                                pos="absolute"
                                style={{
                                    top: 0,
                                    left: "50%",
                                    transform: "translateX(-50%) rotate(45deg)",
                                }}
                            />
                            <Skeleton
                                height={10}
                                width={10}
                                pos="absolute"
                                style={{
                                    top: 10,
                                    left: 6,
                                    transform: "rotate(45deg)",
                                }}
                            />
                            <Skeleton
                                height={10}
                                width={10}
                                pos="absolute"
                                style={{
                                    top: 10,
                                    right: 6,
                                    transform: "rotate(45deg)",
                                }}
                            />
                        </Box>

                        {/* Outs */}
                        <Group gap={4}>
                            <Skeleton height={8} width={8} radius="xl" />
                            <Skeleton height={8} width={8} radius="xl" />
                            <Skeleton height={12} width={30} />
                        </Group>
                    </Stack>

                    <Stack gap={0} align="center" style={{ flex: 1 }}>
                        <Skeleton height={10} width={40} mb={4} />
                        <Skeleton height={32} width={30} />
                    </Stack>
                </Group>
            </Card>

            {/* Tabs */}
            <Card withBorder radius="xl" p={4}>
                <Group gap={0} grow>
                    <Skeleton height={32} radius="xl" />
                    <Skeleton height={32} radius="xl" />
                    <Skeleton height={32} radius="xl" />
                    <Skeleton height={32} radius="xl" />
                </Group>
            </Card>

            {/* Current Batter Card */}
            <Card withBorder radius="lg" p="md" bg="blue.6">
                <Group wrap="nowrap" gap="md" justify="space-between">
                    <Group wrap="nowrap" gap="md" style={{ flex: 1 }}>
                        <Skeleton height={60} width={60} radius="xl" />
                        <Stack gap={4} style={{ flex: 1 }}>
                            <Skeleton height={10} width={80} />
                            <Skeleton height={24} width="100%" />
                        </Stack>
                    </Group>
                    <Stack gap={4} align="flex-end">
                        <Skeleton height={10} width={70} />
                        <Skeleton height={24} width={40} />
                    </Stack>
                </Group>
            </Card>

            {/* Up Next Card */}
            <Card withBorder p="xs" radius="md">
                <Group justify="space-between" wrap="nowrap">
                    <Skeleton height={12} width={60} />
                    <Skeleton height={16} width="60%" />
                </Group>
            </Card>

            {/* Action Pad Area (Live Tab View) */}
            <Stack gap="md">
                <Group grow gap="md" align="flex-start">
                    {/* ON BASE Column */}
                    <Stack gap="xs">
                        <Skeleton height={10} width={50} />
                        <Group grow gap="xs">
                            <Skeleton height={40} radius="md" />
                            <Skeleton height={40} radius="md" />
                        </Group>
                        <Group grow gap="xs">
                            <Skeleton height={40} radius="md" />
                            <Skeleton height={40} radius="md" />
                        </Group>
                        <Group grow gap="xs">
                            <Skeleton height={40} radius="md" />
                            <Skeleton height={40} radius="md" />
                        </Group>
                    </Stack>

                    {/* OUTS Column */}
                    <Stack gap="xs">
                        <Skeleton height={10} width={40} />
                        <Group grow gap="xs">
                            <Skeleton height={40} radius="md" />
                            <Skeleton height={40} radius="md" />
                        </Group>
                        <Group grow gap="xs">
                            <Skeleton height={40} radius="md" />
                            <Skeleton height={40} radius="md" />
                        </Group>
                        <Group grow gap="xs">
                            <Skeleton height={40} radius="md" />
                            <Skeleton height={40} radius="md" />
                        </Group>
                        <Box w="50%" pr="xs">
                            <Skeleton height={40} radius="md" />
                        </Box>
                    </Stack>
                </Group>

                {/* Last Play Card at the bottom */}
                <Card
                    withBorder
                    radius="md"
                    p="sm"
                    style={{
                        borderLeft: "6px solid var(--mantine-color-lime-4)",
                    }}
                >
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Stack gap={4} style={{ flex: 1 }}>
                            <Skeleton height={10} width={60} />
                            <Skeleton height={20} width="90%" />
                            <Skeleton height={12} width="50%" />
                        </Stack>
                        <Skeleton height={40} width={80} radius="xl" />
                    </Group>
                </Card>
            </Stack>
        </Stack>
    );
}

export default function GamedayLoadingSkeleton({ isDesktop }) {
    if (isDesktop) {
        return <DesktopGamedayLoadingSkeleton />;
    }
    return <MobileGamedayLoadingSkeleton />;
}
