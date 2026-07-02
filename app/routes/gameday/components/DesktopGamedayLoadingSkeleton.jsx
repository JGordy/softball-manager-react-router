import { Flex, Stack, Card, Group, Skeleton, Box } from "@mantine/core";

export default function DesktopGamedayLoadingSkeleton() {
    const renderSkeletonGroup = (titleWidth) => (
        <Stack gap="xs">
            <Skeleton height={10} width={titleWidth} />
            {[0, 1].map((row) => (
                <Group key={row} grow gap="xs">
                    {[0, 1, 2].map((col) => (
                        <Skeleton key={col} height={40} radius="md" />
                    ))}
                </Group>
            ))}
        </Stack>
    );

    return (
        <Stack gap="md" mt="md">
            {/* Header */}
            <Group justify="space-between" align="center">
                <Skeleton height={36} width={64} radius="md" />
                <Skeleton height={32} width={140} radius="sm" />
                <Skeleton height={32} width={32} radius="xl" />
            </Group>

            <Box pos="relative">
                <Flex
                    direction={{ base: "column", lg: "row" }}
                    justify="center"
                    align="flex-start"
                    gap="xl"
                    mt="md"
                >
                    {/* COLUMN A: Matchup & Action Controls */}
                    <Stack
                        flex={{ base: "1 1 auto", lg: "55 55 0px" }}
                        maw={{ base: "100%", lg: 825 }}
                        style={{ width: "100%" }}
                        gap="md"
                    >
                        {/* ROW 1: Scoreboard and Current Batter */}
                        <Flex
                            direction={{ base: "column", sm: "row" }}
                            gap="md"
                            align="stretch"
                        >
                            {/* Scoreboard Skeleton */}
                            <Card
                                radius="lg"
                                p="md"
                                style={{ flex: "40 40 0px", minWidth: 0 }}
                            >
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

                            {/* Current Batter & Up Next Stack */}
                            <Stack
                                gap="md"
                                style={{ flex: "60 60 0px", minWidth: 0 }}
                            >
                                <Card radius="lg" p="md">
                                    <Group
                                        justify="space-between"
                                        wrap="nowrap"
                                    >
                                        <Group
                                            wrap="nowrap"
                                            gap="md"
                                            style={{ flex: 1 }}
                                        >
                                            <Skeleton
                                                height={48}
                                                width={48}
                                                radius="xl"
                                            />
                                            <Stack gap={4} style={{ flex: 1 }}>
                                                <Skeleton
                                                    height={10}
                                                    width={80}
                                                />
                                                <Skeleton
                                                    height={16}
                                                    width={120}
                                                />
                                            </Stack>
                                        </Group>
                                        <Stack gap={4} align="flex-end">
                                            <Skeleton height={10} width={60} />
                                            <Skeleton height={16} width={40} />
                                        </Stack>
                                    </Group>
                                </Card>
                                <Card p="xs" radius="md">
                                    <Group
                                        justify="space-between"
                                        gap="sm"
                                        wrap="nowrap"
                                    >
                                        <Skeleton
                                            height={16}
                                            width={60}
                                            radius="sm"
                                        />
                                        <Skeleton
                                            height={16}
                                            width={180}
                                            radius="sm"
                                        />
                                    </Group>
                                </Card>
                            </Stack>
                        </Flex>

                        {/* ROW 2: Action Pad Skeleton */}
                        <Card radius="lg" p="md">
                            <Group grow gap="md" align="flex-start">
                                {renderSkeletonGroup(50)}
                                {renderSkeletonGroup(40)}
                            </Group>
                        </Card>

                        {/* ROW 3: LastPlayCard Skeleton */}
                        <Card
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
                                <Skeleton height={40} width={80} radius="xl" />
                            </Group>
                        </Card>
                    </Stack>

                    {/* COLUMN B: Tabs & Content (Spray Chart / Box Score) */}
                    <Box
                        flex={{ base: "1 1 auto", lg: "45 45 0px" }}
                        maw={{ base: "100%", lg: 675 }}
                        style={{ width: "100%" }}
                    >
                        {/* Tabs Skeleton */}
                        <Card radius="xl" p={4} mb="md">
                            <Group gap={0} grow>
                                <Skeleton height={32} radius="xl" />
                                <Skeleton height={32} radius="xl" />
                                <Skeleton height={32} radius="xl" />
                            </Group>
                        </Card>

                        {/* Large Chart/List Skeleton */}
                        <Card radius="lg" p="md">
                            <Skeleton height={400} width="100%" radius="md" />
                        </Card>
                    </Box>
                </Flex>
            </Box>
        </Stack>
    );
}
