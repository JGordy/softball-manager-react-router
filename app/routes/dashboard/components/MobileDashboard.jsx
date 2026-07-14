import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
    Box,
    Button,
    Card,
    Group,
    Text,
    Title,
    Grid,
    Stack,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import { IconPlus } from "@tabler/icons-react";

import getGames from "@/utils/getGames";
import GameCard from "@/components/GameCard";
import { getGameDayStatus } from "@/utils/dateTime";

export default function MobileDashboard({ teamList, openAddTeamModal }) {
    // helper to pick white or black text based on background hex color luminance
    const getContrastTextColor = (hexColor) => {
        if (!hexColor) return "#000";
        let hex = String(hexColor).replace("#", "");
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("");
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Perceived luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5 ? "#fff" : "#000";
    };

    // Track the active team shown in the carousel. Default to the first team if present.
    const [activeTeamIndex, setActiveTeamIndex] = useState(
        teamList && teamList.length ? 0 : -1,
    );

    const activeTeam = teamList?.[activeTeamIndex];
    const activeTeamId = activeTeam?.$id;

    // Compute games only for the active team so the Next/Most Recent cards reflect
    // the team shown in the carousel.
    const { futureGames, pastGames } = getGames({
        teams: teamList,
        teamId: activeTeamId,
    });

    // Find if there's a live game across both buckets
    const liveGame = [...(futureGames || []), ...(pastGames || [])].find(
        (g) => getGameDayStatus(g.gameDate, true) === "in progress",
    );

    const nextGame = liveGame || futureGames?.[0];
    const rawMostRecent = pastGames?.[0];
    const mostRecentGame =
        liveGame && rawMostRecent?.$id === liveGame.$id
            ? pastGames?.[1]
            : rawMostRecent;

    // reset/initialize active index if team list changes
    useEffect(() => {
        if (!teamList || teamList.length === 0) {
            setActiveTeamIndex(-1);
            return;
        }

        if (activeTeamIndex < 0 || activeTeamIndex >= teamList.length) {
            setActiveTeamIndex(0);
        }
    }, [teamList, activeTeamIndex]);

    return (
        <Grid>
            <Grid.Col span={12}>
                <Group justify="space-between" align="center">
                    <Title order={4}>
                        My Teams ({teamList?.length || "0"})
                    </Title>
                    {teamList?.length > 0 && (
                        <Text component="div" size="sm" c="dimmed">
                            Tap team card for details
                        </Text>
                    )}
                </Group>

                {/* No teams */}
                {!teamList?.length && (
                    <Button
                        variant="light"
                        onClick={openAddTeamModal}
                        fullWidth
                        mt="md"
                    >
                        <Group gap="xs" justify="center">
                            <IconPlus size={18} />
                            <Text>Create your first team</Text>
                        </Group>
                    </Button>
                )}

                {/* Single team: show a simple card and add button */}
                {teamList?.length === 1 && (
                    <Card radius="lg" p="0" mt="lg">
                        <Link to={`/team/${teamList[0].$id}`}>
                            <Card bg={teamList[0].primaryColor} p="lg">
                                <Text c="white" ta="center">
                                    {teamList[0].name}
                                </Text>
                            </Card>
                        </Link>
                    </Card>
                )}

                {/* Multiple teams: carousel */}
                {teamList?.length >= 2 && (
                    <Carousel
                        controlsOffset="xs"
                        slideSize="80%"
                        slideGap="md"
                        emblaOptions={{
                            loop: true,
                            align: "center",
                        }}
                        onSlideChange={(index) => setActiveTeamIndex(index)}
                        pb="md"
                        pt="md"
                        withIndicators
                        withControls={false}
                    >
                        {teamList.map((team, index) => {
                            const isActive = index === activeTeamIndex;
                            const bgColor = team.primaryColor || "#ffffff";
                            const textColor = getContrastTextColor(bgColor);

                            const isTwo = teamList?.length === 2;
                            const isFirst = index === 0;
                            const isLast = index === teamList.length - 1;
                            const slideMarginLeft = isTwo && isFirst ? 12 : 0;
                            const slideMarginRight = isTwo && isLast ? 12 : 0;

                            return (
                                <Carousel.Slide key={team.$id} my="lg">
                                    <Link to={`/team/${team.$id}`}>
                                        <Card
                                            radius="md"
                                            p="lg"
                                            style={{
                                                position: "relative",
                                                transform: isActive
                                                    ? "scale(1.04)"
                                                    : "scale(1)",
                                                transition:
                                                    "transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease",
                                                border: isActive
                                                    ? `2px solid ${team.primaryColor}`
                                                    : "1.5px solid rgba(255,255,255,0.05)",
                                                backgroundColor: bgColor,
                                                boxShadow: isActive
                                                    ? `0 10px 25px -10px ${team.primaryColor}33`
                                                    : "none",
                                                marginLeft: slideMarginLeft,
                                                marginRight: slideMarginRight,
                                            }}
                                        >
                                            <Text
                                                ta="center"
                                                fw={700}
                                                size="md"
                                                c={textColor}
                                                style={{
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {team.name}
                                            </Text>
                                        </Card>
                                    </Link>
                                </Carousel.Slide>
                            );
                        })}
                    </Carousel>
                )}
            </Grid.Col>

            <Grid.Col span={12} pb="xl">
                {activeTeam && (
                    <Group grow gap="xs" mb="lg">
                        {[
                            { label: "Seasons", hash: "seasons" },
                            { label: "Games", hash: "games" },
                            { label: "Roster", hash: "roster" },
                        ].map(({ label, hash }) => (
                            <Button
                                key={hash}
                                component={Link}
                                to={`/team/${activeTeamId}#${hash}`}
                                style={{
                                    backgroundColor: "var(--bg-card)",
                                    color: "var(--mantine-color-text)",
                                    border: "1px solid var(--border-card)",
                                }}
                                radius="md"
                                size="sm"
                            >
                                {label}
                            </Button>
                        ))}
                    </Group>
                )}
                <Stack gap="md">
                    {/* Next Game (for active team) */}
                    {nextGame && Object.keys(nextGame).length > 0 && (
                        <Box>
                            <Title order={4} mb="sm">
                                Upcoming Events
                            </Title>
                            <Card radius="md" p={0} bg="transparent">
                                <GameCard {...nextGame} />
                                <Group justify="end" pt={5} mt="-8px" grow>
                                    {activeTeam?.isManager &&
                                        nextGame?.eventType !== "practice" && (
                                            <Button
                                                component={Link}
                                                to={`/events/${nextGame.$id}/lineup`}
                                                variant="light"
                                                color={
                                                    getGameDayStatus(
                                                        nextGame.gameDate,
                                                        true,
                                                    ) === "in progress"
                                                        ? "blue"
                                                        : "lime"
                                                }
                                                radius="xl"
                                            >
                                                {nextGame.hasLineup
                                                    ? "Edit Lineup"
                                                    : "Create Lineup"}
                                            </Button>
                                        )}
                                    {nextGame?.eventType !== "practice" &&
                                        getGameDayStatus(
                                            nextGame.gameDate,
                                            true,
                                        ) === "in progress" && (
                                            <Button
                                                component={Link}
                                                to={`/events/${nextGame.$id}/gameday`}
                                                radius="xl"
                                                variant="light"
                                            >
                                                Go Live
                                            </Button>
                                        )}
                                </Group>
                            </Card>
                        </Box>
                    )}

                    {/* Most Recent Game (for active team) */}
                    {mostRecentGame &&
                        Object.keys(mostRecentGame).length > 0 && (
                            <Box>
                                <Title order={4} mb="sm">
                                    Most Recent Game
                                </Title>
                                <Card radius="md" p={0} bg="transparent">
                                    <GameCard {...mostRecentGame} />
                                    {mostRecentGame.eventType !==
                                        "practice" && (
                                        <Group
                                            justify="end"
                                            pt={5}
                                            mt="-8px"
                                            grow
                                        >
                                            <Button
                                                component={Link}
                                                to={`/events/${mostRecentGame.$id}?open=awards`}
                                                variant="light"
                                                radius="xl"
                                                color="blue"
                                            >
                                                See Awards
                                            </Button>
                                            <Button
                                                component={Link}
                                                to={`/events/${mostRecentGame.$id}/gameday`}
                                                variant="light"
                                                radius="xl"
                                            >
                                                Recap
                                            </Button>
                                        </Group>
                                    )}
                                </Card>
                            </Box>
                        )}

                    {!nextGame && !mostRecentGame && (
                        <Card radius="md">
                            <Text ta="center">
                                No scheduled events for this team.
                            </Text>
                        </Card>
                    )}
                </Stack>
            </Grid.Col>
        </Grid>
    );
}
