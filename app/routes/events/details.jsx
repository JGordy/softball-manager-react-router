import { useState, useRef } from 'react';
import { redirect, useOutletContext } from 'react-router';

import {
    ActionIcon,
    Container,
    Group,
    Menu,
    Tabs,
    Text,
    Title,
    useComputedColorScheme,
} from "@mantine/core";

import { IconAdjustments, IconCalendarMonth } from '@tabler/icons-react';

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';
import GamesList from '@/components/GamesList';

import getGames from '@/utils/getGames';

export async function clientLoader({ request }) {
    try {
        const session = await account.getSession("current");

        if (!session) {
            throw redirect("/login");
        }

        const { userId } = session;
        const response = await fetch('/api/teams', {
            method: 'POST',
            body: JSON.stringify({ userId, teamRoles: ['manager', 'player'] }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching teams');
        }

        const { managing = [], playing = [] } = await response.json();

        return { userId, teams: { managing, playing } };

    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return <LoaderDots message="Fetching your scheduled events..." />;
}

export default function EventsDetails({ loaderData }) {
    const teams = loaderData?.teams;
    const { user } = useOutletContext();

    const computedColorScheme = useComputedColorScheme('light');

    const ref = useRef();

    const [filterId, setFilterId] = useState();
    const [showFilters, setShowFilters] = useState(false);

    const teamsData = [...teams?.managing, ...teams?.playing];

    const { futureGames, pastGames } = getGames({ teams: teamsData });
    console.log('/events ', { user, teams, futureGames, pastGames });

    const handleMenuItemClick = (teamId) => {
        console.log('/event > handleMenuItemClick', { teamId });
        setFilterId(teamId);
        setShowFilters(false); // Close the menu after clicking an item
    };

    const toggleMenu = () => {
        setShowFilters((prev) => !prev);
    };

    const handleMenuClose = () => {
        setShowFilters(false);
    };

    return (
        <Container p="md" mih="90vh">
            <Group justify="space-between">
                <UserHeader subText="Track your game history" />

                <Menu
                    width="90vw"
                    position="bottom-end"
                    offset={0}
                    opened={showFilters}
                    onClose={handleMenuClose}
                    trigger="click"
                >
                    <Menu.Target>
                        <ActionIcon variant="default" radius="xl" aria-label="Filter Games" size="lg" onClick={toggleMenu}>
                            <IconAdjustments stroke={1.5} size={24} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown bg={(computedColorScheme === 'light') ? "gray.1" : "#1a242f"}>
                        <Menu.Label>Filter Games by Team</Menu.Label>

                        {teamsData?.map(team => (
                            <Menu.Item
                                key={team.name}
                                onClick={() => handleMenuItemClick(team.$id)}
                                bg={filterId === team.$id ? team.primaryColor : undefined}
                                mt="xs"
                            >
                                <Text c={filterId === team.$id ? 'white' : undefined}>{team.name}</Text>
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Title order={5} mt="lg">See detailed information for upcoming and past games</Title>
            <Tabs radius="md" defaultValue="upcoming" mt="xl">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="upcoming" size="lg" leftSection={<IconCalendarMonth size={16} />}>
                        Upcoming
                    </Tabs.Tab>
                    <Tabs.Tab value="past" size="lg" leftSection={<IconCalendarMonth size={16} />}>
                        Past
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="upcoming">
                    <GamesList games={futureGames.filter(game => game.teamId === filterId)} height="65vh" />
                </Tabs.Panel>

                <Tabs.Panel value="past">
                    <GamesList games={pastGames.filter(game => game.teamId === filterId)} height="65vh" />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};