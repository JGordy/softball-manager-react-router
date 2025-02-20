import { useEffect, useState } from 'react';

import {
    Alert,
    Button,
    Flex,
    Container,
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
import { getTeams } from './loader';

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

        const teams = await response.json();

        return { teams, userId };

    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

export async function action({ request, params }) {
    return createTeam({ request, params });
}

const UserDashboard = ({ loaderData }) => {
    const { teams, userId } = loaderData;
    console.log('/teams.jsx', { teams });

    const actionData = useActionData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamList, setTeamList] = useState(teams || []);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 200) {
                    const { response } = actionData;

                    setTeamList((prevTeams) => [...prevTeams, response]);
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

    return (
        <Container>
            <Title order={2} mt="sm" mb="lg">
                My Teams
            </Title>

            {(teamList.length > 0) && (
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
            )}

            {!teamList.length && (
                <Text size="sm">You don't have any teams. Create one below</Text>
            )}

            <Button component="div" variant="link" mt="md" onClick={() => setIsModalOpen(true)} fullWidth>
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
