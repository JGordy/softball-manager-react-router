import { useState } from 'react';
import { useOutletContext } from 'react-router';

import {
    Button,
    Card,
    Container,
    Group,
    List,
    Text,
    Title,
} from '@mantine/core';

import {
    // useActionData,
    redirect,
} from 'react-router';

import { IconMapPin } from '@tabler/icons-react';

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';

import getGames from '@/utils/getGames';
import { formatGameTime } from '@/utils/dateTime';

// import { createTeamAction } from './action';

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

export async function loader({ request }) { };

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

// export async function action({ request }) {
//     return createTeamAction({ request });
// }

// TODO: What to actually make this page?
// If we make this the default page the user lands on, what all should show here?
// Keep individual pages for profile, teams, gameday, etc...
export default function HomePage({ loaderData }) {
    const { user } = useOutletContext();
    console.log('/home ', { loaderData });
    const teams = loaderData?.teams;

    const teamsData = [...teams?.managing, ...teams?.playing];

    // const actionData = useActionData();
    const [teamList, setTeamList] = useState(teamsData || []);

    const { futureGames } = getGames({ teams: teamsData });
    const nextGame = futureGames?.slice(0, 1)?.[0];

    const daysUntilNextGame = (date) => {
        const today = new Date();
        const gameDate = new Date(date);

        const timeDiff = gameDate.getTime() - today.getTime();
        const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days
        const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''}`;

        return ` in ${daysUntilText}!`;
    };
    console.log('/home ', { nextGame, futureGames });

    return (
        <Container p="md" mih="90vh">
            <UserHeader
                user={user}
                subText="Here is a summary of all of your team and event info"
            />

            {(Object.keys(nextGame).length > 0) && (
                <>
                    <Title order={4} mt="xl" mb="md">Upcoming Events</Title>
                    <Text>
                        You have a game
                        <Text span fw={700} c="green">
                            {daysUntilNextGame(nextGame.gameDate)}
                        </Text>
                    </Text>
                    <Card my="md" radius="xl" py="lg">
                        <Text fw={700}>
                            {nextGame.teamName} {nextGame.isHomeGame ? 'vs' : '@'} {nextGame.opponent}
                        </Text>
                        <Group mt="xs" gap="lg">
                            <Text>
                                {formatGameTime(nextGame.gameDate, nextGame.timeZone)}
                            </Text>
                            <Text>
                                <Group gap="2px">
                                    <IconMapPin size={16} />
                                    {nextGame.location}
                                </Group>
                            </Text>
                        </Group>
                    </Card>
                </>
            )}

            <Title order={4} my="md">
                My Teams
            </Title>
            <Card radius="xl" py="lg">
                <List size="sm" maw={400}>
                    {teamList.map((team, index) => (
                        <List.Item key={index}>
                            {team.name} ({team.leagueName})
                        </List.Item>
                    ))}
                </List>

                <Button component="a" variant="link" mt="md" onClick={() => { }}>
                    Create New Team
                </Button>
            </Card>
        </Container>
    );
};
