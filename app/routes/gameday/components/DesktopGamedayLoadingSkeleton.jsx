import { Grid, Stack, Card, Group, Skeleton, Box } from "@mantine/core";

export default function DesktopGamedayLoadingSkeleton() {
    return (
        <Stack gap="md" mt="md">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Skeleton height={36} width={64} radius="md" />
                <Skeleton height={32} width={140} radius="sm" />
                <Skeleton height={32} width={32} radius="xl" />
            </Group>

            <Box pos="relative">
                <Grid gutter="xl" mt="md" align="flex-start">
                    {/* COLUMN 1: Matchup (CompactMatchupCard & LastPlayCard) */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="md">
                            {/* CompactMatchupCard Skeleton */}
                            <Card withBorder radius="lg" p="md">
                                <Group
                                    justify="space-between"
                                    align="center"
                                    wrap="nowrap"
                                >
                                    <Stack
                                        gap={0}
                                        align="center"
                                        style={{ flex: 1 }}
                                    >
                                        <Skeleton
                                            height={10}
                                            width={40}
                                            mb={4}
                                        />
                                        <Skeleton height={32} width={30} />
                                    </Stack>

                                    <Stack
                                        gap="xs"
                                        align="center"
                                        style={{ flex: 1 }}
                                    >
                                        <Skeleton
                                            height={18}
                                            width={60}
                                            radius="sm"
                                        />
                                        <Box
                                            pos="relative"
                                            w={40}
                                            h={28}
                                            mt={4}
                                        >
                                            <Skeleton
                                                height={10}
                                                width={10}
                                                pos="absolute"
                                                style={{
                                                    top: 0,
                                                    left: "50%",
                                                    transform:
                                                        "translateX(-50%) rotate(45deg)",
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
                                        <Group gap={4}>
                                            <Skeleton
                                                height={8}
                                                width={8}
                                                radius="xl"
                                            />
                                            <Skeleton
                                                height={8}
                                                width={8}
                                                radius="xl"
                                            />
                                            <Skeleton height={12} width={30} />
                                        </Group>
                                    </Stack>

                                    <Stack
                                        gap={0}
                                        align="center"
                                        style={{ flex: 1 }}
                                    >
                                        <Skeleton
                                            height={10}
                                            width={40}
                                            mb={4}
                                        />
                                        <Skeleton height={32} width={30} />
                                    </Stack>
                                </Group>
                            </Card>

                            {/* LastPlayCard Skeleton */}
                            <Card
                                withBorder
                                radius="md"
                                p="sm"
                                style={{
                                    borderLeft:
                                        "6px solid var(--mantine-color-lime-4)",
                                }}
                            >
                                <Group
                                    justify="space-between"
                                    align="center"
                                    wrap="nowrap"
                                >
                                    <Stack gap={4} style={{ flex: 1 }}>
                                        <Skeleton height={10} width={60} />
                                        <Skeleton height={20} width="90%" />
                                        <Skeleton height={12} width="50%" />
                                    </Stack>
                                    <Skeleton
                                        height={40}
                                        width={80}
                                        radius="xl"
                                    />
                                </Group>
                            </Card>
                        </Stack>
                    </Grid.Col>

                    {/* COLUMN 2: Action Pad (DefenseCard & ActionPad & FieldingControls) */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="md">
                            <Card withBorder radius="lg" p="md">
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
                            </Card>

                            {/* Fielding Controls rough equivalent */}
                            <Group gap="md" grow>
                                <Skeleton height={50} radius="md" />
                                <Skeleton height={50} radius="md" />
                            </Group>
                            <Skeleton height={40} radius="md" />
                        </Stack>
                    </Grid.Col>

                    {/* COLUMN 3: Tabs & Content (Spray Chart / Box Score) */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        {/* Tabs Skeleton */}
                        <Card withBorder radius="xl" p={4} mb="md">
                            <Group gap={0} grow>
                                <Skeleton height={32} radius="xl" />
                                <Skeleton height={32} radius="xl" />
                                <Skeleton height={32} radius="xl" />
                            </Group>
                        </Card>

                        {/* Large Chart/List Skeleton */}
                        <Card withBorder radius="lg" p="md">
                            <Skeleton height={400} width="100%" radius="md" />
                        </Card>
                    </Grid.Col>
                </Grid>
            </Box>
        </Stack>
    );
}
