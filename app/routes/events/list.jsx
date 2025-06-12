import { useState, useRef } from 'react';
import { redirect, useOutletContext } from 'react-router';

import {
    ActionIcon,
    Group,
    Menu,
    SegmentedControl,
    Tabs,
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

    const [filterId, setFilterId] = useState('all');
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
        if (filterId === 'all') {
            return games;
        }

        return games?.filter(game => game.teamId === filterId);
    }

    const teamFilter = teamsData?.length > 1 && (
        <Menu
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
            <Menu.Dropdown
                bg={(computedColorScheme === 'light') ? "gray.1" : undefined}
                miw="60vw"
            >
                <Menu.Label>Filter Games by Team</Menu.Label>

                <SegmentedControl
                    styles={{ label: { marginBottom: '5px' } }}
                    fullWidth
                    color="green"
                    transitionDuration={0}
                    withItemsBorders={false}
                    orientation="vertical"
                    onChange={handleMenuItemChange}
                    value={filterId}
                    data={[{
                        value: 'all',
                        label: 'All Teams',
                    }, ...teamsData?.map(team => ({
                        value: team.$id,
                        label: team.name,
                    }))]}
                />
            </Menu.Dropdown>
        </Menu>
    );

    return (
        <>
            <UserHeader subText="Track your game history">
                {teamFilter}
            </UserHeader>

            <Title order={5} mt="lg" align="center">See detailed information for your upcoming and past games</Title>
            <Tabs radius="md" defaultValue="upcoming" mt="xl">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="upcoming" leftSection={<IconCalendarMonth size={16} />}>
                        Upcoming
                    </Tabs.Tab>
                    <Tabs.Tab value="past" leftSection={<IconCalendarMonth size={16} />}>
                        Past
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="upcoming">
                    <GamesList
                        games={filterGames(futureGames)}
                        height="60vh"
                    />
                </Tabs.Panel>

                <Tabs.Panel value="past">
                    <GamesList
                        games={filterGames(pastGames)}
                        height="60vh"
                    />
                </Tabs.Panel>
            </Tabs>
        </>
    );
};