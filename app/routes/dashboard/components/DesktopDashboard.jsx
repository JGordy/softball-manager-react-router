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
import GameCalendarRow from "@/components/GameCalendarRow";
import GameCard from "@/components/GameCard";

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
                <Card withBorder radius="md" p="xl" ta="center">
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

                    <Box mb="xl">
                        {[...futureGames, ...pastGames].length > 0 ? (
                            <GameCalendarRow
                                games={[...futureGames, ...pastGames]}
                            />
                        ) : (
                            <Card withBorder radius="md">
                                <Text c="dimmed">
                                    No season schedule found.
                                </Text>
                            </Card>
                        )}
                    </Box>

                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, lg: 7 }}>
                            <Title order={5} mb="md">
                                Upcoming Games
                            </Title>
                            {upcomingGames.length > 0 ? (
                                <SimpleGrid cols={2} spacing="md">
                                    {upcomingGames.map((game) => (
                                        <GameCard key={game.$id} {...game} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Card withBorder radius="md">
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
                                        <GameCard key={game.$id} {...game} />
                                    ))}
                                </Stack>
                            ) : (
                                <Card withBorder radius="md">
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
