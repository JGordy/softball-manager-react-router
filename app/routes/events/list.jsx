import { useState } from "react";
import { useOutletContext } from "react-router";

import {
    ActionIcon,
    Container,
    Group,
    Menu,
    SegmentedControl,
    Tabs,
    Title,
    useComputedColorScheme,
} from "@mantine/core";

import { IconAdjustments, IconCalendarMonth } from "@tabler/icons-react";

import LoaderDots from "@/components/LoaderDots";
import UserHeader from "@/components/UserHeader";
import GamesList from "@/components/GamesList";

import getGames from "@/utils/getGames";

import { getUserTeams } from "@/loaders/teams";

export async function loader({ request }) {
    const { managing, playing, userId } = await getUserTeams({ request });
    return { userId, teams: { managing, playing } };
}

export default function EventsDetails({ loaderData }) {
    const teams = loaderData?.teams;
    const { user } = useOutletContext();

    const computedColorScheme = useComputedColorScheme("light");

    const [filterId, setFilterId] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const teamsData = [...teams?.managing, ...teams?.playing];

    const { futureGames, pastGames } = getGames({ teams: teamsData });
    // console.log('/events ', { user, teams, futureGames, pastGames });

    const handleMenuItemChange = (teamId) => {
        setFilterId(teamId);
        setShowFilters(false); // Close the menu after clicking an item
    };

    const toggleMenu = () => {
        setShowFilters((prev) => !prev);
    };

    const handleMenuClose = () => {
        setShowFilters(false);
    };

    const filterGames = (games) => {
        if (filterId === "all") {
            return games;
        }

        return games?.filter((game) => game.teamId === filterId);
    };

    const teamFilter = teamsData?.length > 1 && (
        <Menu
            position="bottom-end"
            offset={10}
            opened={showFilters}
            onClose={handleMenuClose}
            trigger="click"
            radius="lg"
        >
            <Menu.Target>
                <ActionIcon
                    variant="light"
                    color="green"
                    radius="xl"
                    aria-label="Filter Games"
                    size="lg"
                    onClick={toggleMenu}
                >
                    <IconAdjustments stroke={1.5} size={24} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown
                bg={computedColorScheme === "light" ? "gray.1" : undefined}
                py="md"
                px="xs"
            >
                <Menu.Label>Filter Games by Team</Menu.Label>

                <SegmentedControl
                    styles={{ label: { marginBottom: "10px" } }}
                    fullWidth
                    color="green"
                    transitionDuration={0}
                    withItemsBorders={false}
                    orientation="vertical"
                    onChange={handleMenuItemChange}
                    value={filterId}
                    radius="md"
                    size="md"
                    p="xs"
                    data={[
                        {
                            value: "all",
                            label: "All Teams",
                        },
                        ...teamsData?.map((team) => ({
                            value: team.$id,
                            label: team.name,
                        })),
                    ]}
                />
            </Menu.Dropdown>
        </Menu>
    );

    return (
        <Container>
            <UserHeader subText="Track your game history">
                {teamFilter}
            </UserHeader>

            <Title order={5} mt="lg" align="center">
                See detailed information for your upcoming and past games
            </Title>
            <Tabs radius="md" defaultValue="upcoming" mt="xl">
                <Tabs.List grow justify="center">
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
                </Tabs.List>

                <Tabs.Panel value="upcoming" pt="md">
                    <GamesList games={filterGames(futureGames)} height="60vh" />
                </Tabs.Panel>

                <Tabs.Panel value="past" pt="md">
                    <GamesList games={filterGames(pastGames)} height="60vh" />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}
