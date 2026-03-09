import { Container, Group, Tabs } from "@mantine/core";
import { IconCalendarMonth } from "@tabler/icons-react";

import UserHeader from "@/components/UserHeader";
import GamesList from "@/components/GamesList";
import TabsWrapper from "@/components/TabsWrapper";
import EventsFilter from "./EventsFilter";

export default function MobileEvents({
    teamsData,
    filterId,
    onFilterChange,
    showFilters,
    onToggleFilters,
    onCloseFilters,
    filteredFutureGames,
    filteredPastGames,
    hasFutureGames,
}) {
    return (
        <Container>
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

            <TabsWrapper defaultValue={hasFutureGames ? "upcoming" : "past"}>
                <Tabs.Tab value="upcoming">
                    <Group gap="xs" align="center" justify="center">
                        <IconCalendarMonth size={16} />
                        Upcoming
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="past">
                    <Group gap="xs" align="center" justify="center">
                        <IconCalendarMonth size={16} />
                        Past
                    </Group>
                </Tabs.Tab>

                <Tabs.Panel value="upcoming" pt="md">
                    <GamesList games={filteredFutureGames} height="65vh" />
                </Tabs.Panel>
                <Tabs.Panel value="past" pt="md">
                    <GamesList games={filteredPastGames} height="65vh" />
                </Tabs.Panel>
            </TabsWrapper>
        </Container>
    );
}
