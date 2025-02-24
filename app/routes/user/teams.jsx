import { useEffect, useState } from 'react';

import {
    Alert,
    Button,
    Flex,
    Container,
    Loader,
    Modal,
    Text,
    Title,
} from '@mantine/core';

import {
    useActionData,
    redirect,
} from 'react-router';

import { account } from '@/appwrite';

import { createTeam } from './action';
// import { getTeams } from './loader';

import { IconPlus } from '@tabler/icons-react';

import TeamCard from './components/TeamCard';
import TeamForm from './components/NewTeamForm';

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
    return (
        <Container h="100vh">
            <Flex justify="center" align="center" h="100vh">
                <Loader color="green" type="dots" size={50} />
            </Flex>
        </Container>
    );
}

export async function action({ request, params }) {
    return createTeam({ request, params });
}

const UserDashboard = ({ loaderData }) => {
    const { managing, playing, userId } = loaderData;
    console.log('/teams.jsx', { managing, playing });

    const actionData = useActionData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 201) {
                    setError(null);
                    setIsModalOpen(false);
                } else if (actionData instanceof Error) {
                    setError(actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                setError("An error occurred during team creation.");
            }
        };

        handleAfterSubmit();
    }, [actionData]);

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
        <Container>
            <Title order={2} py="lg">
                My Teams
            </Title>

            {managing.length > 0 && (
                <>
                    <Title order={4} mb="sm">Teams I Manage</Title>
                    {renderTeamList(managing)}
                </>
            )}

            {playing.length > 0 && (
                <>
                    <Title order={4} mb="sm">Teams I Play For</Title>
                    {renderTeamList(playing)}
                </>
            )}

            {(!managing.length && !playing.length) && (
                <Text size="sm">You don't have any teams. Create one below</Text>
            )}

            <Button component="div" variant="link" mt="md" onClick={() => setIsModalOpen(true)} fullWidth>
                <IconPlus size={20} />
                Create New Team
            </Button>

            <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <TeamForm
                    setIsModalOpen={setIsModalOpen}
                    setError={setError}
                />
            </Modal>
        </Container>
    );
};

export default UserDashboard;
