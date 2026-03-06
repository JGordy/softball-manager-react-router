import { Grid, Stack, Card, Group, Skeleton, Box } from "@mantine/core";

export default function DesktopGamedayLoadingSkeleton() {
    return (
        <Stack gap="md">
            <Box pos="relative">
                <Grid gutter="xl" mt="md" align="flex-start">
                    {/* COLUMN 1: Matchup (CompactMatchupCard & LastPlayCard) */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="md">
                            {/* CompactMatchupCard Skeleton */}
                            <Card withBorder radius="lg" p="md">
                                <Group justify="space-between">
                                    <Skeleton height={80} width={120} />
                                    <Stack gap="xs" align="center">
                                        <Skeleton height={30} width={80} />
                                        <Skeleton height={20} width={100} />
                                    </Stack>
                                    <Skeleton height={80} width={120} />
                                </Group>
                            </Card>

                            {/* LastPlayCard Skeleton */}
                            <Card withBorder radius="lg" p="md">
                                <Skeleton height={20} width="40%" mb="md" />
                                <Skeleton height={40} width="100%" />
                            </Card>
                        </Stack>
                    </Grid.Col>

                    {/* COLUMN 2: Action Pad (DefenseCard & ActionPad & FieldingControls) */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="md">
                            <Card withBorder radius="lg" p="md">
                                <Skeleton height={30} width="60%" mb="md" />
                                <Group gap="md" grow>
                                    <Skeleton height={60} radius="md" />
                                    <Skeleton height={60} radius="md" />
                                    <Skeleton height={60} radius="md" />
                                </Group>
                                <Skeleton
                                    height={20}
                                    width="40%"
                                    mt="xl"
                                    mb="md"
                                />
                                <Group gap="md" grow>
                                    <Skeleton height={60} radius="md" />
                                    <Skeleton height={60} radius="md" />
                                    <Skeleton height={60} radius="md" />
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
                        <Group gap="xs" mb="md" justify="flex-start">
                            <Skeleton height={36} width={80} radius="xl" />
                            <Skeleton height={36} width={100} radius="xl" />
                            <Skeleton height={36} width={110} radius="xl" />
                        </Group>

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
