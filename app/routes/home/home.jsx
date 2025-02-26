import { useState } from 'react';

import {
    Box,
    Button,
    Center,
    List,
    Title,
} from '@mantine/core';

import {
    // useActionData,
    redirect,
} from 'react-router';

// import classes from '@/styles/inputs.module.css';

import { account } from '@/appwrite';

// import { createTeamAction } from './action';

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

export async function loader({ request }) {

};

export async function clientLoader({ request }) {
    try {
        const session = await account.getSession('current');
        if (!session) {
            return redirect("/login");
        }
        return null;
    } catch (error) {
        console.log("No active session found");
        return redirect("/login");
    }
};

// export async function action({ request }) {
//     return createTeamAction({ request });
// }

// TODO: What to actually make this page?
// If we make this the default page the user lands on, what all should show here?
// Keep individual pages for profile, teams, gameday, etc...
const TeamsPage = ({ loaderData }) => {
    const teams = loaderData?.teams;

    // const actionData = useActionData();

    const [teamList, setTeamList] = useState(teams || []);

    return (
        <Center>
            <Box mx="auto">
                <Title order={2} mb="sm">
                    Teams
                </Title>
                <List size="sm" maw={400} mx="auto">
                    {teamList.map((team, index) => (
                        <List.Item key={index}>
                            {team.teamName} ({team.leagueName})
                        </List.Item>
                    ))}
                </List>

                <Button component="a" variant="link" mt="md" onClick={() => { }}>
                    Create New Team
                </Button>
            </Box>
        </Center>
    );
};

export default TeamsPage;
