import { Container, Grid, Group, Stack, Title } from "@mantine/core";
import { IconCalendarMonth, IconHistory } from "@tabler/icons-react";

import UserHeader from "@/components/UserHeader";
import GamesList from "@/components/GamesList";
import EventsFilter from "./EventsFilter";

export default function DesktopEvents({
    teamsData,
    filterId,
    onFilterChange,
    showFilters,
    onToggleFilters,
    onCloseFilters,
    filteredFutureGames,
    filteredPastGames,
}) {
    return (
        <Container size="xl">
            <UserHeader subText="Track your game history">
                <EventsFilter
                    teamsData={teamsData}
                    filterId={filterId}
                    onFilterChange={onFilterChange}
                    showFilters={showFilters}
                    onToggleFilters={onToggleFilters}
                    onCloseFilters={onCloseFilters}
                />
            </UserHeader>

            <Grid gutter="xl" mt="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                        <Group gap="xs">
                            <IconCalendarMonth
                                size={28}
                                color="var(--mantine-color-lime-6)"
                            />
                            <Title order={2}>Upcoming Games</Title>
                        </Group>
                        <GamesList games={filteredFutureGames} height="70vh" />
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                        <Group gap="xs">
                            <IconHistory
                                size={28}
                                color="var(--mantine-color-gray-6)"
                            />
                            <Title order={2}>Past Games</Title>
                        </Group>
                        <GamesList games={filteredPastGames} height="70vh" />
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
