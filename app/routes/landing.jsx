import { Form, Link, useLoaderData, useSearchParams } from "react-router";
import { useMediaQuery } from "@mantine/hooks";

import {
    Anchor,
    Badge,
    Button,
    Card,
    Center,
    Container,
    Flex,
    Group,
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
    IconUsers,
} from "@tabler/icons-react";

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

    const features = [
        {
            icon: IconSparkles,
            color: "yellow",
            title: "AI Powered Lineups",
            description:
                "Generate the best lineup available using in-depth game and individual player history.",
        },
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
