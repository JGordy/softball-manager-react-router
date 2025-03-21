import { useEffect } from 'react';
import {
    useActionData,
    redirect,
} from 'react-router';

import {
    Button,
    Flex,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconPlus } from '@tabler/icons-react';

import LoaderDots from '@/components/LoaderDots';
import UserHeader from '@/components/UserHeader';

import AddTeam from '@/forms/AddTeam';

import { account } from '@/appwrite';

import { createTeam } from './action';
// import { getTeams } from './loader';

import TeamCard from './components/TeamCard';

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

export async function clientLoader({ request }) {
    try {
        const session = await account.getSession("current");

        if (!session) {
            throw redirect("/login");
        }

        const { userId } = session;
        const response = await fetch('/api/teams', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching teams');
        }

        const { managing, playing } = await response.json();

        return { managing, playing, userId };

    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return <LoaderDots message="Fetching your teams..." />;
}

export async function action({ request, params }) {
    return createTeam({ request, params });
}

const UserDashboard = ({ loaderData }) => {
    const { managing, playing, userId } = loaderData;

    const actionData = useActionData();

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

    const openAddTeamModal = () => modals.open({
        title: 'Add a New Team',
        children: (
            <AddTeam
                actionRoute={'/teams'}
                userId={userId}
            />
        ),
    });

    const renderTeamList = (teamList) => {
        return (teamList.length > 0) && (
            <Flex
                direction={{ base: 'column', sm: 'row' }}
                justify={{ base: 'center', sm: 'start' }}
                align={{ base: 'stretch', sm: 'center' }}
                wrap="wrap"
                gap={{ base: 'sm', sm: 'lg' }}
                mih={50}
            >
                {teamList.map((team) => (
                    <TeamCard
                        key={team.$id}
                        team={team}
                        userId={userId}
                    />
                ))}
            </Flex>
        )
    };

    return (
        <>
            <UserHeader subText="Here are all of your teams" />

            {managing.length > 0 && (
                <>
                    <Title order={4} my="sm" c="dimmed">Teams I Manage</Title>
                    {renderTeamList(managing)}
                </>
            )}

            {playing.length > 0 && (
                <>
                    <Title order={4} mb="sm" c="dimmed">Teams I Play For</Title>
                    {renderTeamList(playing)}
                </>
            )}

            {(!managing.length && !playing.length) && (
                <Text size="sm">You don't have any teams. Create one below</Text>
            )}

            <Button component="div" variant="link" mt="md" onClick={openAddTeamModal} fullWidth>
                <IconPlus size={20} />
                Create New Team
            </Button>
        </>
    );
};

export default UserDashboard;
