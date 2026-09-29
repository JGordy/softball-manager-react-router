import { useState } from "react";
import {
    Box,
    Card,
    Title,
    Text,
    Group,
    Badge,
    useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Carousel } from "@mantine/carousel";

import SeasonRadarChart from "./SeasonRadarChart";
import SeasonProgressionChart from "./SeasonProgressionChart";
import ContactSprayChart from "@/components/ContactSprayChart";
import { trackEvent } from "@/utils/analytics";

/**
 * SeasonChartsPanel component that surfaces Season Performance Radar, Team Batting Trends,
 * and Contact Spray Chart without nested sub-tabs:
 * - Desktop: Full-Width Carousel with Clickable Controls & Indicators
 * - Mobile: Touch-friendly Carousel with header active label and peekaboo slide preview
 *
 * @param {Object} props - Component props
 * @param {Object} props.season - Season document
 * @param {Array} props.games - Season games
 * @param {Array} props.logs - Season game logs
 * @param {Array} props.players - Roster players
 * @param {Array} props.battersList - Formatted batters list for spray chart filter
 * @param {Object} [props.previousSeasonData] - Previous season summary data
 * @param {string} [props.primaryColor="lime"] - Accent color
 * @returns {JSX.Element} The rendered charts panel
 */
export default function SeasonChartsPanel({
    season,
    games = [],
    logs = [],
    players = [],
    battersList = [],
    previousSeasonData = null,
    primaryColor = "lime",
}) {
    const [activeSlide, setActiveSlide] = useState(0);
    const activeGames = games.length > 0 ? games : season?.games || [];
    const slides = [
        {
            title: "Season Performance Radar",
            description: "Multi-axis team output & benchmarking (0–100 scale)",
        },
        {
            title: "Team Batting Trends",
            description: "Game-by-game cumulative batting rates & progression",
        },
        {
            title: "Contact Spray Chart",
            description:
                "Interactive ball-in-play hit distribution & locations",
        },
    ];

    const radarNode = (
        <SeasonRadarChart
            seasonId={season?.$id}
            games={activeGames}
            logs={logs}
            players={players}
            previousSeasonData={previousSeasonData}
            primaryColor={primaryColor}
        />
    );

    const trendsNode = (
        <SeasonProgressionChart
            seasonId={season?.$id}
            games={activeGames}
            logs={logs}
            players={players}
            primaryColor={primaryColor}
            isActive={activeSlide === 1}
        />
    );

    const sprayNode = (
        <Card
            withBorder
            padding="lg"
            radius="md"
            style={{ overflow: "hidden" }}
        >
            <ContactSprayChart
                hits={logs}
                batters={battersList}
                layout="stacked"
                games={activeGames}
            />
        </Card>
    );

    const theme = useMantineTheme();
    const isMobile = useMediaQuery(
        `(max-width: ${theme.breakpoints.sm})`,
        false,
        { getInitialValueInEffect: false },
    );

    return (
        <Box>
            {/* Header: Active Slide Title, Description & Slide Badge */}
            <Group justify="space-between" align="flex-start" mb="sm" px="xs">
                <div>
                    <Title order={4} c="bright">
                        {slides[activeSlide].title}
                    </Title>
                    <Text size="xs" c="dimmed">
                        {slides[activeSlide].description}
                    </Text>
                </div>
                <Badge size="xs" variant="light" color="lime">
                    {activeSlide + 1} OF {slides.length}
                </Badge>
            </Group>

            {/* Unified Responsive Carousel */}
            <Carousel
                slideSize={{ base: "95%", sm: "100%" }}
                slideGap={{ base: "sm", sm: 0 }}
                align="center"
                withControls={!isMobile}
                withIndicators={!isMobile}
                loop={false}
                onSlideChange={(index) => {
                    setActiveSlide(index);
                    const chartTypes = ["radar", "trends", "spray"];
                    trackEvent("season-charts-slide-view", {
                        seasonId: season?.$id,
                        slideIndex: index,
                        chartName: chartTypes[index] || "unknown",
                    });
                    setTimeout(() => {
                        window.dispatchEvent(new Event("resize"));
                    }, 100);
                }}
                nextControlProps={{ "aria-label": "Next chart" }}
                previousControlProps={{ "aria-label": "Previous chart" }}
                styles={{
                    viewport: {
                        paddingLeft: 4,
                        paddingRight: 4,
                    },
                    control: {
                        backgroundColor: "var(--mantine-color-dark-6)",
                        borderColor: "var(--mantine-color-default-border)",
                        color: "var(--mantine-color-text)",
                        "&[dataInactive]": {
                            opacity: 0,
                            cursor: "default",
                        },
                    },
                    indicator: {
                        backgroundColor: "var(--mantine-color-gray-6)",
                        transition:
                            "width 250ms ease, background-color 250ms ease",
                        "&[dataActive]": {
                            backgroundColor: "var(--mantine-color-lime-5)",
                            width: 18,
                        },
                    },
                }}
            >
                <Carousel.Slide style={{ minWidth: 0 }}>
                    {radarNode}
                </Carousel.Slide>
                <Carousel.Slide style={{ minWidth: 0 }}>
                    {trendsNode}
                </Carousel.Slide>
                <Carousel.Slide style={{ minWidth: 0 }}>
                    {sprayNode}
                </Carousel.Slide>
            </Carousel>
        </Box>
    );
}
