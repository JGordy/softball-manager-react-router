import {
    Badge,
    Card,
    Container,
    Flex,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    rem,
} from "@mantine/core";
import {
    IconCalendarStats,
    IconChartBar,
    IconClipboardList,
    IconDeviceMobileMessage,
    IconSparkles,
    IconTrophy,
    IconUsers,
} from "@tabler/icons-react";

export default function FeaturesSection() {
    const features = [
        {
            icon: IconClipboardList,
            color: "blue",
            title: "Dynamic Game Scoring",
            description:
                "Intuitive scoring interface that updates player stats and team analytics in real-time.",
        },
        {
            icon: IconUsers,
            color: "grape",
            title: "Team Management",
            description: "Centralize your roster and player details.",
        },
        {
            icon: IconCalendarStats,
            color: "green",
            title: "Season Schedules",
            description: "Keep track of games and locations easily.",
        },
        {
            icon: IconDeviceMobileMessage,
            color: "orange",
            title: "Attendance Tracking",
            description: "Know who is showing up before game day.",
        },
        {
            icon: IconChartBar,
            color: "red",
            title: "Player Analytics",
            description:
                "Visualize player performance with deep statistical insights.",
        },
        {
            icon: IconTrophy,
            color: "yellow",
            title: "Game Awards & Voting",
            description:
                "Keep the friendly rivalry alive with peer-voted MVPs and superlatives.",
        },
    ];

    return (
        <Container size="lg" py={100} pos="relative">
            <Stack align="center" mb={60} pos="relative" style={{ zIndex: 1 }}>
                <Badge variant="filled" color="green" size="lg" radius="sm">
                    Features
                </Badge>
                <Title order={2} ta="center" fz={rem(48)} fw={900}>
                    Everything you need to manage your team
                </Title>
                <Text c="dimmed" ta="center" maw={600} fz="lg">
                    Ditch the spreadsheets and group chats. RostrHQ brings
                    advanced tools to your recreational league.
                </Text>
            </Stack>

            <Card
                shadow="sm"
                padding="xl"
                radius="md"
                mb={30}
                style={{
                    border: "2px solid transparent",
                    backgroundImage:
                        "linear-gradient(white, white), linear-gradient(135deg, var(--mantine-color-grape-6) 0%, var(--mantine-color-cyan-6) 100%)",
                    backgroundOrigin: "border-box",
                    backgroundClip: "padding-box, border-box",
                }}
            >
                <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "flex-start", md: "center" }}
                    gap="xl"
                >
                    <ThemeIcon
                        size={60}
                        radius="md"
                        variant="gradient"
                        gradient={{ from: "grape", to: "cyan", deg: 135 }}
                    >
                        <IconSparkles
                            style={{
                                width: rem(32),
                                height: rem(32),
                                color: "white",
                            }}
                        />
                    </ThemeIcon>
                    <Stack gap={4}>
                        <Text fw={700} size="xl">
                            AI Powered Lineups
                        </Text>
                        <Text size="md" c="dimmed" lh="1.6">
                            Generate the best lineup available using in-depth
                            game and individual player history.
                        </Text>
                    </Stack>
                </Flex>
            </Card>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={30}>
                {features.map((feature, index) => (
                    <Card
                        key={feature.title}
                        shadow="sm"
                        padding="xl"
                        radius="md"
                        withBorder
                    >
                        <ThemeIcon
                            size={50}
                            radius="md"
                            variant="light"
                            color={feature.color || "green"}
                            mb="md"
                        >
                            <feature.icon
                                style={{ width: rem(28), height: rem(28) }}
                            />
                        </ThemeIcon>
                        <Text fw={700} size="xl" mb="xs">
                            {feature.title}
                        </Text>
                        <Text size="sm" c="dimmed" lh="1.6">
                            {feature.description}
                        </Text>
                    </Card>
                ))}
            </SimpleGrid>
        </Container>
    );
}
