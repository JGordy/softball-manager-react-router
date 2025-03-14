import { useEffect } from 'react';

import { Link } from 'react-router';

import {
    Button,
    Card,
    Container,
    Group,
    ScrollArea,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { redirect } from 'react-router';

import { IconMapPin, IconPlus } from '@tabler/icons-react';

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';

import AddTeam from '@/forms/AddTeam';
import { createTeam } from '@/actions/teams';

import getGames from '@/utils/getGames';
import { formatGameTime } from '@/utils/dateTime';


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

    const getRecentGameResult = () => {
        const result = mostRecentGame?.result;
        if (result === 'win') {
            return 'green';
        }

        if (result === 'loss') {
            return 'red';
        }

        return 'yellow';
    }

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
        <Container p="md" mih="90vh">
            <UserHeader subText="Here is a summary of all of your team and event info" />

            {(Object.keys(nextGame).length > 0) && (
                <>
                    <Title order={4} mt="xl" mb="md">Upcoming Events</Title>
                    <Text span>
                        You have a game
                    </Text>
                    <Text span fw={700} c="green">
                        {daysUntilNextGame(nextGame.gameDate)}
                    </Text>
                    <Link to={`/events/${nextGame.$id}`}>
                        <Card my="md" radius="md" py="lg" withBorder>
                            <Text fw={700}>
                                {nextGame.teamName} {nextGame.isHomeGame ? 'vs' : '@'} {nextGame.opponent}
                            </Text>
                            <Group mt="xs" gap="lg">
                                <Text>
                                    {formatGameTime(nextGame.gameDate, nextGame.timeZone)}
                                </Text>
                                <Group gap="2px">
                                    <IconMapPin size={16} />
                                    <Text>{nextGame.location}</Text>
                                </Group>
                            </Group>
                        </Card>
                    </Link>
                </>
            )}

            {(Object.keys(mostRecentGame).length > 0) && (
                <>
                    <Title order={4} mt="xl" mb="md">Most Recent Game</Title>
                    <Link to={`/events/${mostRecentGame.$id}`}>
                        <Card my="md" radius="md" py="lg" withBorder>
                            <Text fw={700}>
                                {mostRecentGame.teamName} {mostRecentGame.isHomeGame ? 'vs' : '@'} {mostRecentGame.opponent}
                            </Text>
                            <Group mt="xs" gap="lg">
                                <Text>
                                    {formatGameTime(mostRecentGame.gameDate, mostRecentGame.timeZone)}
                                </Text>
                                <Group gap="2px">
                                    <Text c={getRecentGameResult()}>{mostRecentGame.result || "Results not posted"}</Text>
                                </Group>
                            </Group>
                        </Card>
                    </Link>
                </>
            )}

            <Title order={4} my="md">
                My Teams ({teamList?.length || '0'})
            </Title>
            <Card radius="md" py="lg" withBorder>
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
                            <Card key={index} bg={team.primaryColor}>
                                <Text style={{ whiteSpace: 'nowrap' }}>
                                    {team.name}
                                </Text>
                            </Card>
                        ))}
                    </Group>
                </ScrollArea.Autosize>
            </Card>
        </Container>
    );
};
