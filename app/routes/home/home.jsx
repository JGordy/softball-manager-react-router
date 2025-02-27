import { useState } from 'react';

import {
    Card,
    Button,
    Container,
    List,
    Title,
} from '@mantine/core';

import {
    // useActionData,
    redirect,
} from 'react-router';

import { account } from '@/appwrite';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';

import getGames from '@/utils/getGames';

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
        const response = await fetch('/api/profile', {
            method: 'POST',
            body: JSON.stringify({ userId, teamRoles: ['manager', 'player'] }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching teams');
        }

        const { user, managing = [], playing = [] } = await response.json();

        return { user, userId, teams: { managing, playing } };

    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return <LoaderDots message="Fetching your teams..." />;
}

// export async function action({ request }) {
//     return createTeamAction({ request });
// }

// TODO: What to actually make this page?
// If we make this the default page the user lands on, what all should show here?
// Keep individual pages for profile, teams, gameday, etc...
export default function HomePage({ loaderData }) {
    console.log({ loaderData });
    const teams = loaderData?.teams;
    const user = loaderData?.user;

    const teamsData = [...teams?.managing, ...teams?.playing];

    // const actionData = useActionData();
    const [teamList, setTeamList] = useState(teamsData || []);

    const { futureGames } = getGames({ teams: teamsData });
    console.log({ futureGames });

    return (
        <Container p="md" h="100vh">
            <UserHeader user={user} />

            {/* TODO: Add next game card */}

            <Card>
                <Title order={2} mb="sm">
                    Teams
                </Title>
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
