import { Link } from "react-router";

import {
    Box,
    Button,
    Card,
    Grid,
    Group,
    Text,
    Title,
    Stack,
    SimpleGrid,
} from "@mantine/core";

import getGames from "@/utils/getGames";
import GameCard from "@/components/GameCard";
import { getGameDayStatus } from "@/utils/dateTime";

export default function DesktopDashboard({
    teamList,
    activeTeamId,
    openAddTeamModal,
}) {
    const activeTeam = teamList?.find((t) => t.$id === activeTeamId);

    // Compute games only for the active team
    const { futureGames, pastGames } = getGames({
        teams: teamList,
        teamId: activeTeamId,
    });

    // We can show more games on desktop
    const upcomingGames = futureGames?.slice(0, 4) || [];
    const recentGames = pastGames?.slice(0, 4) || [];

    return (
        <Box mt="xl">
            {!teamList?.length ? (
                <Card radius="md" p="xl" ta="center">
                    <Text size="lg" mb="md">
                        You don't have any teams yet.
                    </Text>
                    <Button onClick={openAddTeamModal}>
                        Create your first team
                    </Button>
                </Card>
            ) : activeTeam ? (
                <Box>
                    <Group justify="space-between" align="center" mb="md">
                        <Title order={5}>Season Schedule overview</Title>
                        <Button
                            component={Link}
                            to={`/team/${activeTeam.$id}`}
                            variant="filled"
                            size="sm"
                            color={activeTeam.primaryColor}
                        >
                            View Full Team Details
                        </Button>
                    </Group>

                    {/* Calendar row removed */}

                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, lg: 7 }}>
                            <Title order={5} mb="md">
                                Upcoming Games
                            </Title>
                            {upcomingGames.length > 0 ? (
                                <SimpleGrid cols={2} spacing="md">
                                    {upcomingGames.map((game) => (
                                        <Card
                                            key={game.$id}
                                            radius="md"
                                            p={0}
                                            pb="sm"
                                            bg="transparent"
                                        >
                                            <GameCard {...game} />
                                            <Group
                                                justify="end"
                                                pt={5}
                                                mt="-8px"
                                            >
                                                {activeTeam?.isManager && (
                                                    <Button
                                                        component={Link}
                                                        to={`/events/${game.$id}/lineup`}
                                                        variant="light"
                                                        radius="xl"
                                                    >
                                                        {game.hasLineup
                                                            ? "Edit Lineup"
                                                            : "Create Lineup"}
                                                    </Button>
                                                )}
                                                {getGameDayStatus(
                                                    game.gameDate,
                                                    true,
                                                ) === "in progress" && (
                                                    <Button
                                                        component={Link}
                                                        to={`/events/${game.$id}/gameday`}
                                                        variant="light"
                                                        radius="xl"
                                                    >
                                                        Go Live
                                                    </Button>
                                                )}
                                            </Group>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Card radius="md">
                                    <Text c="dimmed">
                                        No upcoming games scheduled.
                                    </Text>
                                </Card>
                            )}
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, lg: 5 }}>
                            <Title order={5} mb="md">
                                Recent Results
                            </Title>
                            {recentGames.length > 0 ? (
                                <Stack gap="md">
                                    {recentGames.map((game) => (
                                        <Card
                                            key={game.$id}
                                            radius="md"
                                            p={0}
                                            pb="sm"
                                            bg="transparent"
                                        >
                                            <GameCard {...game} />
                                            <Group
                                                justify="end"
                                                pt={5}
                                                mt="-8px"
                                            >
                                                <Button
                                                    component={Link}
                                                    to={`/events/${game.$id}?open=awards`}
                                                    variant="light"
                                                    radius="xl"
                                                    color="blue"
                                                >
                                                    See Awards
                                                </Button>
                                                <Button
                                                    component={Link}
                                                    to={`/events/${game.$id}/gameday`}
                                                    variant="light"
                                                    radius="xl"
                                                >
                                                    Recap
                                                </Button>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : (
                                <Card radius="md">
                                    <Text c="dimmed">No past games found.</Text>
                                </Card>
                            )}
                        </Grid.Col>
                    </Grid>
                </Box>
            ) : null}
        </Box>
    );
}
