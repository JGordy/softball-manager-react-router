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
import aiSportsColumnImg from "@/assets/ai-sports-column.png";
import playerAchievementsImg from "@/assets/player-achievements.png";

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
                {images.map((img) => (
                    <Carousel.Slide key={img.src || img.alt}>
                        <Image
                            src={img.src}
                            alt={img.alt}
                            radius="md"
                            shadow="xl"
                            h={{ base: 400, md: 500 }}
                            fit="contain"
                            loading="lazy"
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
            {/* Showcase 1: Game Day */}
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
                    description="An intuitive, touch-first interface designed for mobile. Track every hit, play, and runner advancement with a couple of taps."
                    features={[
                        "Live play-by-play tracking",
                        "Precise hit location input",
                        "Intelligent runner advancement paths",
                    ]}
                />

                <ImageCarousel
                    images={[
                        {
                            src: dashboardImg,
                            alt: "Screenshot showing the live game scoring dashboard with real-time player statistics and scoring controls",
                        },
                        {
                            src: fieldImg,
                            alt: "Screenshot of the field input interface for recording hit locations",
                        },
                        {
                            src: scoringImg,
                            alt: "Screenshot demonstrating how to advance runners on the base paths",
                        },
                    ]}
                />
            </Flex>

            {/* Showcase 2: AI Recaps */}
            <Flex
                direction={{ base: "column-reverse", md: "row" }}
                gap={60}
                align="center"
                mb={120}
            >
                <Box flex={1} w="100%">
                    <Card padding="lg" bg="gray.0" shadow="xl" radius="md">
                        <Image
                            src={aiSportsColumnImg}
                            alt="AI Sports Column newspaper-style write-up for a game final"
                            radius="md"
                            h={{ base: 400, md: 500 }}
                            w="auto"
                            fit="contain"
                            mx="auto"
                            loading="lazy"
                        />
                    </Card>
                </Box>

                <ShowcaseText
                    badge="AI Coverage"
                    color="grape"
                    title="Your personal sports journalist"
                    description="No more boring box scores. Get automatically generated, professional sports columns summarizing your team's performance immediately after the final out."
                    features={[
                        "Automated newspaper-style editorial write-ups",
                        "Highlights key plays and game-changing moments",
                        "Makes every recreational league feel like the pros",
                    ]}
                />
            </Flex>

            {/* Showcase 3: Insights */}
            <Flex
                direction={{ base: "column", md: "row" }}
                gap={60}
                align="center"
                mb={120}
            >
                <ShowcaseText
                    badge="Insights"
                    color="red"
                    title="Advanced batting analytics"
                    description="Go beyond the box score. Visualize player tendencies with generated spray charts and advanced stats."
                    features={[
                        "Visual spray charts for every player",
                        "Filter by batting side (Left/Right), hit type or location",
                        "Identify gaps and hitting preferences",
                    ]}
                />

                <Box flex={1} w="100%">
                    <Card padding="lg" bg="gray.0" shadow="xl" radius="md">
                        <Image
                            src={sprayChartImg}
                            alt="Visual spray chart showing a player's hit distribution across the field"
                            radius="md"
                            h={{ base: 400, md: 500 }}
                            w="auto"
                            fit="contain"
                            mx="auto"
                            loading="lazy"
                        />
                    </Card>
                </Box>
            </Flex>

            {/* Showcase 4: Recognition & Achievements */}
            <Flex
                direction={{ base: "column-reverse", md: "row" }}
                gap={60}
                align="center"
            >
                <ImageCarousel
                    images={[
                        {
                            src: playerAchievementsImg,
                            alt: "Player profile view showing unlocked milestones and achievements with rarity tags",
                        },
                        {
                            src: awardVoteImg,
                            alt: "Interface for voting on post-game awards and MVPs",
                        },
                        {
                            src: gameAwardImg,
                            alt: "Display of the 'Game Ball' award given to the MVP",
                        },
                        {
                            src: playerAwardsImg,
                            alt: "Profile view showing a collection of player awards and badges",
                        },
                    ]}
                    delay={AUTOPLAY_DELAY_AWARDS}
                />

                <ShowcaseText
                    badge="Recognition"
                    color="orange"
                    title="Achievements & awards"
                    description="Track player milestones and celebrate outstanding performances. Build team engagement with real-time achievements and post-game awards."
                    features={[
                        "In-game achievements with color-coded rarity tiers",
                        "Fun, unlockable milestones on player profiles",
                        "Post-game voting for MVP and key accolades",
                    ]}
                />
            </Flex>
        </Container>
    );
}
