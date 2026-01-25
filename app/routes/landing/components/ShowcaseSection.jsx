import { useMemo } from "react";

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
import awardVoteImg from "@/assets/award-vote.png";
import gameAwardImg from "@/assets/game-award.png";
import playerAwardsImg from "@/assets/player-awards.png";

const AUTOPLAY_DELAY_DEFAULT = 4000;
const AUTOPLAY_DELAY_AWARDS = 5000;

function ShowcaseText({ badge, color, title, description, features }) {
    return (
        <Stack flex={1} gap="md">
            <Badge
                variant="light"
                color={color}
                size="lg"
                className="mantine-visible-from-md"
            >
                {badge}
            </Badge>
            <Title order={2} fz={rem(42)}>
                {title}
            </Title>
            <Text c="dimmed" size="lg">
                {description}
            </Text>
            <List
                spacing="sm"
                size="lg"
                mt="md"
                center
                icon={
                    <ThemeIcon color={color} size={24} radius="xl">
                        <IconCheck
                            style={{
                                width: rem(14),
                                height: rem(14),
                            }}
                        />
                    </ThemeIcon>
                }
            >
                {features.map((feature) => (
                    <List.Item key={feature}>{feature}</List.Item>
                ))}
            </List>
        </Stack>
    );
}

function ImageCarousel({ images, delay = AUTOPLAY_DELAY_DEFAULT }) {
    const autoplay = useMemo(() => Autoplay({ delay }), [delay]);

    return (
        <Box flex={1} w="100%">
            <Carousel
                withIndicators
                loop
                align="center"
                slideGap="md"
                plugins={[autoplay]}
                onMouseEnter={autoplay.stop}
                onMouseLeave={autoplay.reset}
                nextControlProps={{ "aria-label": "Next slide" }}
                previousControlProps={{ "aria-label": "Previous slide" }}
                styles={{
                    control: {
                        backgroundColor: "var(--mantine-color-white)",
                        color: "var(--mantine-color-dark-filled)",
                    },
                }}
            >
                {images.map((img, index) => (
                    <Carousel.Slide key={index}>
                        <Image
                            src={img.src}
                            alt={img.alt}
                            radius="md"
                            shadow="xl"
                            h={{ base: 400, md: 500 }}
                            fit="contain"
                        />
                    </Carousel.Slide>
                ))}
            </Carousel>
            <Text ta="center" size="sm" c="dimmed" mt="sm" visibleFrom="sm">
                Screenshots of actual product
            </Text>
        </Box>
    );
}

export default function ShowcaseSection() {
    return (
        <Container size="lg" py={100} style={{ overflow: "hidden" }}>
            <Flex
                direction={{ base: "column", md: "row" }}
                gap={60}
                align="center"
                mb={120}
            >
                <ShowcaseText
                    badge="Game Day"
                    color="blue"
                    title="Score games in real-time"
                    description="An intuitive, touch-first interface designed for mobile. Track every hit and play with a couple of taps."
                    features={[
                        "Live play-by-play tracking",
                        "Precise field location input",
                        "Intelligent runner advancement",
                    ]}
                />

                <ImageCarousel
                    images={[
                        { src: dashboardImg, alt: "Scoring Dashboard" },
                        { src: fieldImg, alt: "Field Input Interface" },
                        { src: scoringImg, alt: "Runner Advancement" },
                    ]}
                />
            </Flex>

            <Flex
                direction={{ base: "column-reverse", md: "row" }}
                gap={60}
                align="center"
            >
                <Box flex={1}>
                    <Card padding="lg" bg="gray.0">
                        <Image
                            src={sprayChartImg}
                            alt="Hit Distribution Spray Chart"
                            radius="md"
                            h={{ base: 400, md: 500 }}
                            w="auto"
                            fit="contain"
                            mx="auto"
                        />
                    </Card>
                </Box>

                <ShowcaseText
                    badge="Insights"
                    color="red"
                    title="Advanced batting analytics"
                    description="Go beyond the box score. Visualize player tendencies with generated spray charts and advanced stats."
                    features={[
                        "Visual spray charts for every player",
                        "Filter by batting side (Left/Right), hit type or location",
                        "Identify gaps and weaknesses",
                    ]}
                />
            </Flex>

            <Flex
                direction={{ base: "column", md: "row" }}
                gap={60}
                align="center"
                mt={120}
            >
                <ShowcaseText
                    badge="Recognition"
                    color="orange"
                    title="Celebrate team heroes"
                    description="Recognize outstanding performances with post-game awards. Build team morale by voting for MVPs and key plays."
                    features={[
                        "Post-game voting for MVP & accolades",
                        "Track award history on player profiles",
                        "Fun, interactive celebration screens",
                    ]}
                />

                <ImageCarousel
                    images={[
                        { src: awardVoteImg, alt: "Award Voting Screen" },
                        { src: gameAwardImg, alt: "Game Award Screen" },
                        { src: playerAwardsImg, alt: "Player Awards Screen" },
                    ]}
                    delay={AUTOPLAY_DELAY_AWARDS}
                />
            </Flex>
        </Container>
    );
}
