import { Grid, Title, Box, Card, Text, Stack, Group } from "@mantine/core";
import { Link } from "react-router";
import { DateTime } from "luxon";

import GameCalendarRow from "@/components/GameCalendarRow";
import GameCard from "@/components/GameCard";
import getGames from "@/utils/getGames";

import DesktopRosterTable from "./DesktopRosterTable";

export default function DesktopTeamDetails({
    team,
    players,
    managerIds,
    managerView,
    user,
    teamLogs,
}) {
    const { seasons } = team;

    // Use getGames to pull future and past games for this team
    const { futureGames, pastGames } = getGames({
        teams: [team],
        teamId: team.$id,
    });

    const upcomingGames = futureGames?.slice(0, 3) || [];
    const recentGames = pastGames?.slice(0, 3) || [];

    const today = DateTime.local();
    const inProgressSeasons =
        seasons?.filter(
            (season) =>
                DateTime.fromISO(season.startDate) <= today &&
                DateTime.fromISO(season.endDate) >= today,
        ) || [];
    const upcomingSeasons =
        seasons
            ?.filter((season) => DateTime.fromISO(season.startDate) > today)
            .sort(
                (a, b) =>
                    DateTime.fromISO(a.startDate).toMillis() -
                    DateTime.fromISO(b.startDate).toMillis(),
            ) || [];
    const pastSeasons =
        seasons
            ?.filter(
                (season) =>
                    DateTime.fromISO(season.endDate).toMillis() <
                    today.toMillis(),
            )
            .sort(
                (a, b) =>
                    DateTime.fromISO(b.endDate).toMillis() -
                    DateTime.fromISO(a.endDate).toMillis(),
            ) || [];

    const sortedSeasons = [
        ...inProgressSeasons,
        ...upcomingSeasons,
        ...pastSeasons,
    ];

    return (
        <Box mt="lg">
            <Grid gutter="xl" align="flex-start">
                <Grid.Col span={{ base: 12, lg: 7 }}>
                    <Title order={4} mb="md">
                        Team Roster
                    </Title>
                    <DesktopRosterTable
                        players={players}
                        managerIds={managerIds}
                        managerView={managerView}
                        user={user}
                        teamLogs={teamLogs}
                    />
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 5 }}>
                    <Stack gap="xl">
                        <Box>
                            <Title order={4} mb="md">
                                Games Schedule
                            </Title>
                            {[...futureGames, ...pastGames].length > 0 ? (
                                <Card withBorder radius="md">
                                    <GameCalendarRow
                                        games={[...futureGames, ...pastGames]}
                                    />
                                </Card>
                            ) : (
                                <Card withBorder radius="md">
                                    <Text c="dimmed">
                                        No games scheduled yet.
                                    </Text>
                                </Card>
                            )}
                        </Box>

                        {upcomingGames.length > 0 && (
                            <Box>
                                <Title order={4} mb="md">
                                    Upcoming Games
                                </Title>
                                <Stack gap="md">
                                    {upcomingGames.map((game) => (
                                        <GameCard key={game.$id} {...game} />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <Box>
                            <Group justify="space-between" mb="md">
                                <Title order={4}>Recent Results</Title>
                            </Group>
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
                        </Box>

                        {sortedSeasons.length > 0 && (
                            <Box>
                                <Title order={4} mb="md">
                                    Seasons Overview
                                </Title>
                                <Stack gap="sm">
                                    {sortedSeasons.map((s) => (
                                        <Card
                                            key={s.$id}
                                            withBorder
                                            radius="md"
                                            p="sm"
                                            component={Link}
                                            to={`/season/${s.$id}`}
                                            style={{ textDecoration: "none" }}
                                        >
                                            <Group justify="space-between">
                                                <Text
                                                    fw={500}
                                                    c="var(--mantine-color-text)"
                                                >
                                                    {s.seasonName}
                                                </Text>
                                                <Text size="sm" c="dimmed">
                                                    {s.games?.length || 0} games
                                                </Text>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>
        </Box>
    );
}
