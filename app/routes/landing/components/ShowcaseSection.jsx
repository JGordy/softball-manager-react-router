import { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
    Badge,
    Box,
    Card,
    Container,
    Flex,
    Image,
    List,
    Stack,
    Text,
    ThemeIcon,
    Title,
    rem,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

import dashboardImg from "@/assets/scoring-dashboard.png";
import fieldImg from "@/assets/touch-to-score.png";
import scoringImg from "@/assets/advance-runners.png";
import sprayChartImg from "@/assets/spray-chart.png";

export function ShowcaseSection() {
    const autoplay = useRef(Autoplay({ delay: 4000 }));

    return (
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
                        An intuitive, touch-first interface designed for mobile.
                        Track every hit and play with a couple of taps.
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
                        <List.Item>Intelligent runner advancement</List.Item>
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
                                backgroundColor: "var(--mantine-color-white)",
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
    );
}
