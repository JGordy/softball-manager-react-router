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
import { getGameDayStatus } from "@/utils/dateTime";
import MobileHeader from "./MobileHeader";
import MobileTeamCard from "./MobileTeamCard";
import { UpcomingEventCard, MostRecentGameCard } from "./MobileEventCards";
import classes from "./MobileDashboard.module.css";

/**
 * MobileDashboard - Cyber-Athletic Premium UI for mobile dashboard view.
 *
 * @param {Object} props
 * @param {Array} props.teamList - List of teams
 * @param {Function} props.openAddTeamModal - Callback to open add team modal
 * @param {Object} [props.user] - User object
 * @param {boolean} [props.isVerified] - Whether email is verified
 * @param {string} [props.userId] - Current user ID
 * @param {string} [props.activeTeamId] - Active team ID
 * @param {Function} [props.setActiveTeamId] - Callback to set active team ID
 * @returns {JSX.Element}
 */
export default function MobileDashboard({
    teamList = [],
    openAddTeamModal,
    user,
    isVerified = false,
    userId,
    activeTeamId: propActiveTeamId,
    setActiveTeamId: propSetActiveTeamId,
}) {
    // Determine active index
    const [localActiveIndex, setLocalActiveIndex] = useState(
        teamList && teamList.length ? 0 : -1,
    );

    const activeTeamIndex =
        propActiveTeamId && teamList?.length
            ? Math.max(
                  0,
                  teamList.findIndex((t) => t.$id === propActiveTeamId),
              )
            : localActiveIndex;

    const activeTeam = teamList?.[activeTeamIndex] || teamList?.[0];
    const activeTeamId = activeTeam?.$id;

    const handleSelectTeam = (teamId) => {
        const idx = teamList.findIndex((t) => t.$id === teamId);
        if (idx !== -1) {
            setLocalActiveIndex(idx);
            if (propSetActiveTeamId) propSetActiveTeamId(teamId);
        }
    };

    const handleSlideChange = (index) => {
        setLocalActiveIndex(index);
        const team = teamList?.[index];
        if (team && propSetActiveTeamId) {
            propSetActiveTeamId(team.$id);
        }
    };

    // Games for the active team
    const { futureGames, pastGames } = getGames({
        teams: teamList,
        teamId: activeTeamId,
    });

    // Find live game across both lists
    const liveGame = [...(futureGames || []), ...(pastGames || [])].find(
        (g) => getGameDayStatus(g.gameDate, true) === "in progress",
    );

    const nextGame = liveGame || futureGames?.[0];
    const rawMostRecent = pastGames?.[0];
    const mostRecentGame =
        liveGame && rawMostRecent?.$id === liveGame.$id
            ? pastGames?.[1]
            : rawMostRecent;

    useEffect(() => {
        if (!teamList || teamList.length === 0) {
            setLocalActiveIndex(-1);
            return;
        }

        if (localActiveIndex < 0 || localActiveIndex >= teamList.length) {
            setLocalActiveIndex(0);
        }
    }, [teamList, localActiveIndex]);

    return (
        <Box pb="xl">
            {/* 1. Dynamic Collapsing Sticky Header */}
            <MobileHeader
                user={user}
                isVerified={isVerified}
                activeTeam={activeTeam}
                teamList={teamList}
                onSelectTeam={handleSelectTeam}
                userId={userId}
            />

            <Grid mt="xs">
                <Grid.Col span={12}>
                    <Group justify="space-between" align="center" mb="xs">
                        <Text className={classes.teamsSectionTitle} mt="sm">
                            My Teams ({teamList?.length || 0})
                        </Text>
                    </Group>

                    {/* No teams empty state */}
                    {!teamList?.length && (
                        <Button
                            variant="light"
                            onClick={openAddTeamModal}
                            fullWidth
                            mt="md"
                            radius="xl"
                            color="lime"
                        >
                            <Group gap="xs" justify="center">
                                <IconPlus size={18} />
                                <Text>Create your first team</Text>
                            </Group>
                        </Button>
                    )}

                    {/* Single team */}
                    {teamList?.length === 1 && (
                        <Box my="sm">
                            <MobileTeamCard
                                team={teamList[0]}
                                isActive={true}
                            />
                        </Box>
                    )}

                    {/* Multiple teams: Carousel with organic asymmetric cards */}
                    {teamList?.length >= 2 && (
                        <Box className={classes.carouselWrapper} pb="sm">
                            <Carousel
                                slideSize="74%"
                                slideGap="xs"
                                emblaOptions={{
                                    loop: true,
                                    align: "center",
                                    skipSnaps: false,
                                }}
                                onSlideChange={handleSlideChange}
                                withIndicators
                                withControls={false}
                                initialSlide={
                                    activeTeamIndex >= 0 ? activeTeamIndex : 0
                                }
                            >
                                {teamList.map((team, index) => {
                                    const isActive = index === activeTeamIndex;
                                    return (
                                        <Carousel.Slide
                                            key={team.$id}
                                            pt="sm"
                                            pb="xs"
                                        >
                                            <MobileTeamCard
                                                team={team}
                                                isActive={isActive}
                                            />
                                        </Carousel.Slide>
                                    );
                                })}
                            </Carousel>
                        </Box>
                    )}
                </Grid.Col>

                <Grid.Col span={12} pt="xs">
                    {/* Quick navigation pill tabs for active team */}
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
                                    className={classes.quickNavButton}
                                    radius="xl"
                                    size="sm"
                                >
                                    {label}
                                </Button>
                            ))}
                        </Group>
                    )}

                    <Stack gap="lg">
                        {/* Upcoming Events (for active team) */}
                        {nextGame && Object.keys(nextGame).length > 0 && (
                            <Box>
                                <Title
                                    order={4}
                                    className={classes.sectionTitle}
                                >
                                    Upcoming Events
                                </Title>
                                <UpcomingEventCard
                                    game={nextGame}
                                    activeTeam={activeTeam}
                                />
                            </Box>
                        )}

                        {/* Most Recent Game (for active team) */}
                        {mostRecentGame &&
                            Object.keys(mostRecentGame).length > 0 && (
                                <Box>
                                    <Title
                                        order={4}
                                        className={classes.sectionTitle}
                                    >
                                        Most Recent Game
                                    </Title>
                                    <MostRecentGameCard
                                        game={mostRecentGame}
                                        activeTeam={activeTeam}
                                    />
                                </Box>
                            )}

                        {!nextGame && !mostRecentGame && (
                            <Card
                                radius="xl"
                                p="lg"
                                style={{
                                    backgroundColor: "#141c26",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                }}
                            >
                                <Text ta="center" c="dimmed" size="sm">
                                    No scheduled events for this team.
                                </Text>
                            </Card>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>
        </Box>
    );
}
