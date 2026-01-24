import { useRef } from "react";
import { Form, Link, useLoaderData, useSearchParams } from "react-router";

import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useMediaQuery } from "@mantine/hooks";

import {
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Container,
    Flex,
    Group,
    Image,
    List,
    Paper,
    RingProgress,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    rem,
} from "@mantine/core";

import {
    IconArrowRight,
    IconCalendarStats,
    IconChartBar,
    IconCheck,
    IconClipboardList,
    IconDeviceMobileMessage,
    IconSparkles,
    IconTrophy,
    IconUsers,
} from "@tabler/icons-react";

import dashboardImg from "@/assets/scoring-dashboard.png";
import fieldImg from "@/assets/touch-to-score.png";
import scoringImg from "@/assets/advance-runners.png";
import sprayChartImg from "@/assets/spray-chart.png";

import branding from "@/constants/branding";
import { createSessionClient } from "@/utils/appwrite/server";
import { logoutAction } from "@/actions/logout";

export async function action({ request }) {
    return logoutAction({ request });
}

export async function loader({ request }) {
    try {
        const { account } = await createSessionClient(request);
        await account.get();
        return { isAuthenticated: true };
    } catch {
        return { isAuthenticated: false };
    }
}

export default function Landing() {
    const { isAuthenticated } = useLoaderData();
    const [searchParams] = useSearchParams();
    const isDesktop = searchParams.get("platform") === "desktop";
    const isMobileUI = useMediaQuery("(max-width: 48em)");

    const autoplay = useRef(Autoplay({ delay: 4000 }));

    const features = [
        {
            icon: IconClipboardList,
            color: "blue",
            title: "Dynamic Game Scoring",
            description:
                "Intuitive scoring interface that updates player stats and team analytics in real-time.",
        },
        {
            icon: IconCalendarStats,
            color: "green",
            title: "Season Schedules",
            description: "Keep track of games and locations easily.",
        },
        {
            icon: IconUsers,
            color: "grape",
            title: "Team Management",
            description: "Centralize your roster and player details.",
        },
        {
            icon: IconDeviceMobileMessage,
            color: "orange",
            title: "Attendance Tracking",
            description: "Know who is showing up before game day.",
        },
        {
            icon: IconTrophy,
            color: "yellow",
            title: "Game Awards & Voting",
            description:
                "Keep the friendly rivalry alive with peer-voted MVPs and superlatives.",
        },
        {
            icon: IconChartBar,
            color: "red",
            title: "Player Analytics",
            description:
                "Visualize player performance with deep statistical insights.",
        },
    ];

    return (
        <div
            style={{
                backgroundColor: "var(--mantine-color-gray-0)",
                minHeight: "100vh",
            }}
        >
            {/* Hero Section */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, var(--mantine-color-green-9) 0%, var(--mantine-color-green-7) 100%)",
                    color: "white",
                    padding: `${rem(120)} 0 ${rem(160)}`,
                    textAlign: "center",
                    borderBottomRightRadius: "50% 40px",
                    borderBottomLeftRadius: "50% 40px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Abstract Background Shapes */}
                <div
                    style={{
                        position: "absolute",
                        top: -100,
                        left: -100,
                        width: 400,
                        height: 400,
                        background:
                            "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                        borderRadius: "50%",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -50,
                        right: -50,
                        width: 300,
                        height: 300,
                        background:
                            "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                        borderRadius: "50%",
                    }}
                />

                <Container
                    size="md"
                    style={{ position: "relative", zIndex: 1 }}
                >
                    <Title
                        order={1}
                        style={{
                            fontSize: rem(64),
                            fontWeight: 900,
                            lineHeight: 1.1,
                            letterSpacing: -1,
                        }}
                    >
                        {branding.name}
                    </Title>
                    <Text
                        size="xl"
                        mt="xl"
                        opacity={0.9}
                        style={{
                            maxWidth: 600,
                            margin: "auto",
                            fontSize: rem(24),
                        }}
                    >
                        {branding.tagline}
                    </Text>

                    <Group justify="center" mt={50} w="100%">
                        {isAuthenticated ? (
                            <Stack
                                gap="sm"
                                w={isMobileUI ? "100%" : "auto"}
                                maw={400}
                                mx="auto"
                            >
                                <Text
                                    c="white"
                                    fw={500}
                                    bg="rgba(0,0,0,0.2)"
                                    px="lg"
                                    py={4}
                                    style={{ borderRadius: 20 }}
                                >
                                    {isDesktop
                                        ? "This app is designed for Mobile. Please use your phone."
                                        : "You are currently logged in."}
                                </Text>
                                <Flex
                                    direction={isMobileUI ? "column" : "row"}
                                    gap="sm"
                                    w="100%"
                                >
                                    {!isDesktop && (
                                        <Button
                                            component={Link}
                                            to="/"
                                            size="xl"
                                            variant="white"
                                            color="dark"
                                            radius="xl"
                                            fullWidth={isMobileUI}
                                            rightSection={
                                                <IconArrowRight size={20} />
                                            }
                                        >
                                            Go to Dashboard
                                        </Button>
                                    )}
                                    <Form
                                        method="post"
                                        style={{
                                            width: isMobileUI ? "100%" : "auto",
                                        }}
                                    >
                                        <Button
                                            type="submit"
                                            size="xl"
                                            variant="outline"
                                            color="white"
                                            radius="xl"
                                            fullWidth={isMobileUI}
                                            style={{
                                                color: "white",
                                                borderColor:
                                                    "rgba(255,255,255,0.4)",
                                            }}
                                        >
                                            Logout
                                        </Button>
                                    </Form>
                                </Flex>
                            </Stack>
                        ) : (
                            <Button
                                component={Link}
                                to="/login"
                                size="xl"
                                variant="white"
                                color="dark"
                                radius="xl"
                                fullWidth={isMobileUI}
                                rightSection={<IconArrowRight size={20} />}
                            >
                                Get Started
                            </Button>
                        )}
                    </Group>
                </Container>
            </div>

            {/* Features Section */}
            <Container size="lg" py={100} pos="relative">
                <Stack
                    align="center"
                    mb={60}
                    pos="relative"
                    style={{ zIndex: 1 }}
                >
                    <Badge variant="filled" color="green" size="lg" radius="sm">
                        Features
                    </Badge>
                    <Title order={2} ta="center" fz={rem(48)} fw={900}>
                        Everything you need to manage your team
                    </Title>
                    <Text c="dimmed" ta="center" maw={600} fz="lg">
                        Ditch the spreadsheets and group chats. RostrHQ brings
                        professional-grade tools to your recreational league.
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
                                Generate the best lineup available using
                                in-depth game and individual player history.
                            </Text>
                        </Stack>
                    </Flex>
                </Card>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={30}>
                    {features.map((feature, index) => (
                        <Card
                            key={index}
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

            {/* Feature Showcase Section */}
            <Container size="lg" py={100} style={{ overflow: "hidden" }}>
                <Flex
                    direction={{ base: "column", md: "row" }}
                    gap={60}
                    align="center"
                    mb={120}
                >
                    <Stack flex={1} gap="md">
                        <Badge
                            variant="light"
                            color="blue"
                            size="lg"
                            className="mantine-visible-from-md"
                        >
                            Game Day
                        </Badge>
                        <Title order={2} fz={rem(42)}>
                            Score games in real-time
                        </Title>
                        <Text c="dimmed" size="lg">
                            An intuitive, touch-first interface designed for
                            mobile. Track every hit and play with a couple of
                            taps.
                        </Text>
                        <List
                            spacing="sm"
                            size="lg"
                            mt="md"
                            center
                            icon={
                                <ThemeIcon color="blue" size={24} radius="xl">
                                    <IconCheck
                                        style={{
                                            width: rem(14),
                                            height: rem(14),
                                        }}
                                    />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>Live play-by-play tracking</List.Item>
                            <List.Item>Precise field location input</List.Item>
                            <List.Item>
                                Intelligent runner advancement
                            </List.Item>
                        </List>
                    </Stack>

                    <Box flex={1} w="100%">
                        <Carousel
                            withIndicators
                            loop
                            align="center"
                            slideGap="md"
                            plugins={[autoplay.current]}
                            onMouseEnter={autoplay.current.stop}
                            onMouseLeave={autoplay.current.reset}
                            styles={{
                                control: {
                                    backgroundColor:
                                        "var(--mantine-color-white)",
                                    color: "var(--mantine-color-dark-filled)",
                                },
                            }}
                        >
                            <Carousel.Slide>
                                <Image
                                    src={dashboardImg}
                                    radius="md"
                                    shadow="xl"
                                    h={{ base: 400, md: 500 }}
                                    fit="contain"
                                />
                            </Carousel.Slide>
                            <Carousel.Slide>
                                <Image
                                    src={fieldImg}
                                    radius="md"
                                    shadow="xl"
                                    h={{ base: 400, md: 500 }}
                                    fit="contain"
                                />
                            </Carousel.Slide>
                            <Carousel.Slide>
                                <Image
                                    src={scoringImg}
                                    radius="md"
                                    shadow="xl"
                                    h={{ base: 400, md: 500 }}
                                    fit="contain"
                                />
                            </Carousel.Slide>
                        </Carousel>
                        <Text
                            ta="center"
                            size="sm"
                            c="dimmed"
                            mt="sm"
                            visibleFrom="sm"
                        >
                            Screenshots from actual gameplay
                        </Text>
                    </Box>
                </Flex>

                <Flex
                    direction={{ base: "column-reverse", md: "row" }}
                    gap={60}
                    align="center"
                >
                    <Box flex={1}>
                        <Card
                            padding="lg"
                            radius="lg"
                            shadow="xl"
                            withBorder
                            bg="gray.0"
                        >
                            <Title order={4} mb="md" ta="center">
                                Hit Distribution
                            </Title>
                            <Image src={sprayChartImg} radius="md" />
                        </Card>
                    </Box>

                    <Stack flex={1} gap="md">
                        <Badge
                            variant="light"
                            color="red"
                            size="lg"
                            className="mantine-visible-from-md"
                        >
                            Insights
                        </Badge>
                        <Title order={2} fz={rem(42)}>
                            Advanced batting analytics
                        </Title>
                        <Text c="dimmed" size="lg">
                            Go beyond the box score. Visualize player tendencies
                            with generated spray charts and advanced stats.
                        </Text>
                        <List
                            spacing="sm"
                            size="lg"
                            mt="md"
                            center
                            icon={
                                <ThemeIcon color="red" size={24} radius="xl">
                                    <IconCheck
                                        style={{
                                            width: rem(14),
                                            height: rem(14),
                                        }}
                                    />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>
                                Visual spray charts for every player
                            </List.Item>
                            <List.Item>
                                Filter by batting side (Left/Right) or specific
                                games
                            </List.Item>
                            <List.Item>Identify gaps and weaknesses</List.Item>
                        </List>
                    </Stack>
                </Flex>
            </Container>

            {/* CTA Section */}
            <Container size="lg" pb={100}>
                <Paper
                    radius="md"
                    p={rem(60)}
                    withBorder
                    style={{
                        background:
                            "linear-gradient(135deg, var(--mantine-color-green-9) 0%, var(--mantine-color-green-8) 100%)",
                        color: "white",
                        textAlign: "center",
                    }}
                >
                    <Title order={2} fz={rem(36)} mb="md">
                        Ready to take the field?
                    </Title>
                    <Text mb="xl" opacity={0.8} maw={600} mx="auto" size="lg">
                        Simplify your softball management. Join us in building
                        the ultimate toolbox for managers and players.
                    </Text>
                    {!isAuthenticated && (
                        <Button
                            component={Link}
                            to="/login"
                            size="xl"
                            variant="white"
                            color="dark"
                            radius="xl"
                            fullWidth={isMobileUI}
                        >
                            Get Started Now
                        </Button>
                    )}
                </Paper>
            </Container>

            {/* Footer */}
            <Container py="xl" ta="center">
                <Text c="dimmed" size="sm">
                    © {new Date().getFullYear()} {branding.name}. All rights
                    reserved.
                </Text>
                <Text c="dimmed" size="sm" mt={4}>
                    <Anchor
                        href="https://github.com/JGordy/softball-manager-react-router"
                        target="_blank"
                    >
                        View on GitHub
                    </Anchor>
                </Text>
            </Container>
        </div>
    );
}
