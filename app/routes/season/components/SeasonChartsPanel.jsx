import { useState } from "react";
import { Box, Card, Title, Text, Group, Badge } from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import SeasonRadarChart from "./SeasonRadarChart";
import ContactSprayChart from "@/components/ContactSprayChart";

/**
 * SeasonChartsPanel component that surfaces Season Performance Radar and Contact Spray Chart
 * without nested sub-tabs:
 * - Desktop: 2-column side-by-side analytical grid
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
            title: "Contact Spray Chart",
            description:
                "Interactive ball-in-play hit distribution & locations",
        },
    ];

    const radarNode = (
        <SeasonRadarChart
            games={activeGames}
            logs={logs}
            players={players}
            previousSeasonData={previousSeasonData}
            primaryColor={primaryColor}
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

            {/* Desktop Layout: Full-Width Carousel with Clickable Controls & Indicators */}
            <Box visibleFrom="sm">
                <Carousel
                    slideSize="100%"
                    align="center"
                    withControls
                    withIndicators
                    loop={false}
                    onSlideChange={setActiveSlide}
                    nextControlProps={{ "aria-label": "Next chart" }}
                    previousControlProps={{ "aria-label": "Previous chart" }}
                    styles={{
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
                        {sprayNode}
                    </Carousel.Slide>
                </Carousel>
            </Box>

            {/* Mobile Layout: Touch Carousel with Peekaboo Effect */}
            <Box hiddenFrom="sm">
                <Carousel
                    slideSize="95%"
                    slideGap="sm"
                    align="center"
                    withIndicators={false}
                    withControls={false}
                    loop={false}
                    onSlideChange={setActiveSlide}
                    styles={{
                        viewport: {
                            paddingLeft: 4,
                            paddingRight: 4,
                        },
                    }}
                >
                    <Carousel.Slide style={{ minWidth: 0 }}>
                        {radarNode}
                    </Carousel.Slide>
                    <Carousel.Slide style={{ minWidth: 0 }}>
                        {sprayNode}
                    </Carousel.Slide>
                </Carousel>
            </Box>
        </Box>
    );
}
