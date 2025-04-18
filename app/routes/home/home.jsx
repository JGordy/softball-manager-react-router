import { useEffect } from 'react';

import {
    Button,
    Card,
    Group,
    ScrollArea,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { Link, redirect } from 'react-router';

import { IconPlus } from '@tabler/icons-react';

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';
import GameCard from '@/components/GameCard';

import AddTeam from '@/forms/AddTeam';
import { createTeam } from '@/actions/teams';

import getGames from '@/utils/getGames';

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

// export async function loader({ request }) { };

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
    return <LoaderDots message="Fetching your teams and events..." />;
}

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === 'add-team') {
        return createTeam({ values, userId });
    }
}

export default function HomePage({ loaderData, actionData }) {
    // const { userId } = useOutletContext();
    console.log('/home ', { loaderData });
    const teams = loaderData?.teams;
    const userId = loaderData?.userId;

    const teamList = [...teams?.managing, ...teams?.playing];

    const { futureGames, pastGames } = getGames({ teams: teamList });
    const nextGame = futureGames?.slice(0, 1)?.[0];
    const mostRecentGame = pastGames?.slice(0, 1)?.[0];

    const daysUntilNextGame = (date) => {
        const today = new Date();
        const gameDate = new Date(date);

        const timeDiff = gameDate.getTime() - today.getTime();
        const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days
        const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''}`;

        return ` in ${daysUntilText}!`;
    };

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 201) {
                    modals.closeAll();
                } else if (actionData instanceof Error) {
                    console.error('An error occurred during team creation.', actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    console.log('/home ', { nextGame, futureGames, pastGames, userId });

    const openAddTeamModal = () => modals.open({
        title: 'Add a New Team',
        children: (
            <AddTeam
                actionRoute={'/'}
                userId={userId}
            />
        ),
    });

    return (
        <>
            <UserHeader subText="Here is a summary of all of your team and event info" />

            {(Object.keys(nextGame).length > 0) && (
                <>
                    <Title order={4} mt="xl">Upcoming Events</Title>
                    <Text span>
                        You have a game
                    </Text>
                    <Text span fw={700} c="green">
                        {daysUntilNextGame(nextGame.gameDate)}
                    </Text>
                    <GameCard {...nextGame} />
                </>
            )}

            {(Object.keys(mostRecentGame).length > 0) && (
                <>
                    <Title order={4} mt="xl">Most Recent Game</Title>
                    <GameCard {...mostRecentGame} />
                </>
            )}

            <Title order={4} mt="xl">
                My Teams ({teamList?.length || '0'})
            </Title>
            <Card radius="md" py="lg" mt="md" withBorder>
                <ScrollArea.Autosize py="5px">
                    <Group miw={400} wrap="nowrap">
                        <Card align="center" px="0">
                            <Button variant="transparent" onClick={openAddTeamModal}>
                                <Text align="center" style={{ whiteSpace: 'nowrap' }}>
                                    <IconPlus size={18} />
                                    Add Team
                                </Text>
                            </Button>
                        </Card>
                        {teamList.map((team, index) => (
                            <Link to={`/team/${team.$id}`} key={index}>
                                <Card bg={team.primaryColor} c="white">
                                    <Text style={{ whiteSpace: 'nowrap' }}>
                                        {team.name}
                                    </Text>
                                </Card>
                            </Link>
                        ))}
                    </Group>
                </ScrollArea.Autosize>
            </Card>
        </>
    );
};
