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
    Tabs,
    SimpleGrid,
} from "@mantine/core";

import { IconPlus } from "@tabler/icons-react";

import getGames from "@/utils/getGames";
import GameCalendarRow from "@/components/GameCalendarRow";
import GameCard from "@/components/GameCard";

export default function DesktopDashboard({ teamList, openAddTeamModal }) {
    // Determine initial active team ID
    const initialTeamId =
        teamList && teamList.length > 0 ? teamList[0].$id : null;
    const [activeTeamId, setActiveTeamId] = useState(initialTeamId);

    // If teamList changes and the activeTeamId is no longer in the list, reset it
    useEffect(() => {
        if (!teamList || teamList.length === 0) {
            setActiveTeamId(null);
        } else if (!teamList.find((t) => t.$id === activeTeamId)) {
            setActiveTeamId(teamList[0].$id);
        }
    }, [teamList, activeTeamId]);

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
            <Group justify="space-between" align="center" mb="lg">
                <Title order={4}>My Teams ({teamList?.length || "0"})</Title>
                <Button
                    variant="light"
                    color="gray"
                    size="sm"
                    onClick={openAddTeamModal}
                    leftSection={<IconPlus size={16} />}
                >
                    Add Team
                </Button>
            </Group>

            {!teamList?.length ? (
                <Card withBorder radius="md" p="xl" ta="center">
                    <Text size="lg" mb="md">
                        You don't have any teams yet.
                    </Text>
                    <Button onClick={openAddTeamModal}>
                        Create your first team
                    </Button>
                </Card>
            ) : (
                <Tabs
                    value={activeTeamId}
                    onChange={setActiveTeamId}
                    variant="outline"
                    radius="md"
                    color={activeTeam?.primaryColor}
                >
                    <Tabs.List>
                        {teamList.map((team) => (
                            <Tabs.Tab
                                key={team.$id}
                                value={team.$id}
                                leftSection={
                                    <Box
                                        w={12}
                                        h={12}
                                        style={{
                                            borderRadius: "50%",
                                            backgroundColor:
                                                team.primaryColor || "gray",
                                        }}
                                    />
                                }
                            >
                                <Text fw={500}>{team.name}</Text>
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {teamList.map((team) => (
                        <Tabs.Panel key={team.$id} value={team.$id} pt="xl">
                            <Box mb="xl">
                                <Group justify="space-between" mb="md">
                                    <Title order={5}>
                                        Season Schedule overview
                                    </Title>
                                    <Button
                                        component={Link}
                                        to={`/team/${team.$id}`}
                                        variant="light"
                                        size="xs"
                                    >
                                        View Full Team Details
                                    </Button>
                                </Group>
                                <GameCalendarRow
                                    games={[...futureGames, ...pastGames]}
                                />
                            </Box>

                            <Grid gutter="xl">
                                <Grid.Col span={8}>
                                    <Title order={5} mb="md">
                                        Upcoming Games
                                    </Title>
                                    {upcomingGames.length > 0 ? (
                                        <SimpleGrid cols={2} spacing="md">
                                            {upcomingGames.map((game) => (
                                                <GameCard
                                                    key={game.$id}
                                                    {...game}
                                                />
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

                                <Grid.Col span={4}>
                                    <Title order={5} mb="md">
                                        Recent Results
                                    </Title>
                                    {recentGames.length > 0 ? (
                                        <Stack gap="md">
                                            {recentGames.map((game) => (
                                                <GameCard
                                                    key={game.$id}
                                                    {...game}
                                                />
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Card withBorder radius="md">
                                            <Text c="dimmed">
                                                No past games found.
                                            </Text>
                                        </Card>
                                    )}
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    ))}
                </Tabs>
            )}
        </Box>
    );
}
