import { useEffect, useState } from 'react';

import {
    Alert,
    Box,
    Button,
    Center,
    Group,
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

export async function loader({ request, params }) {
    const { userId } = params;

    if (userId) {
        return { teams: await getTeams({ userId }) };
    } else {
        return { teams: [] };
    }
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

export async function action({ request, params }) {
    return createTeam({ request, params });
}

const UserDashboard = ({ loaderData }) => {
    const teams = loaderData?.teams;

    const actionData = useActionData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamList, setTeamList] = useState(teams || []);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            console.log('Does this even work?', { actionData });
            try {
                if (actionData && actionData.status === 200) {
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
        <Center>
            <Box mx="auto">
                <Title order={2} mb="sm">
                    Teams
                </Title>
                {(teamList.length > 0) && (
                    <Group direction="column" spacing="xl">
                        {teamList.map((team) => {
                            // const navigate = useNavigate();
                            // const handleCardClick = () => {
                            //     navigate(`/team/${team.$id}`); // Navigate to team page
                            // };

                            return (
                                <TeamCard {...team} />
                            );
                        })}
                    </Group>
                )}

                {!teamList.length && (
                    <Text size="sm">You don't have any teams. Create one below</Text>
                )}

                <Button component="a" variant="link" mt="md" onClick={() => setIsModalOpen(true)}>
                    Create New Team
                </Button>

                <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
                    {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                    <TeamForm />
                </Modal>
            </Box>
        </Center>
    );
};

export default UserDashboard;
