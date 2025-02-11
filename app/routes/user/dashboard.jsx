import { useEffect, useState } from 'react';

import {
    Alert,
    Button,
    Flex,
    Container,
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

export async function loader({ params }) {
    const { userId } = params;

    if (userId) {
        return { teams: await getTeams({ userId }) };
    } else {
        return { teams: [] };
    }
};

export async function clientLoader({ params, serverLoader }) {
    const { userId } = params;
    const { teams: serverTeams } = await serverLoader();

    try {
        const session = await account.getSession("current");
        if (!session) {
            return redirect("/login");
        }

        const teams = serverTeams.length > 0  // Check if serverTeams has data
            ? serverTeams // Use server-loaded teams if available
            : userId ? await getTeams({ userId }) : []; // Otherwise, fetch if userId exists

        return { teams };

    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

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
        <Container>
            <Flex
                style={{ minHeight: '100vh' }}
                mih={50}
                bg="rgba(0, 0, 0, .3)"
                gap="md"
                justify="flex-start"
                align="center"
                direction="column"
                wrap="wrap"
            >
                <Title order={2} mb="sm">
                    My Teams
                </Title>
                {(teamList.length > 0) && (
                    <Group spacing="xl">
                        {teamList.map((team) => <TeamCard key={team.$id} {...team} />)}
                    </Group>
                )}

                {!teamList.length && (
                    <Text size="sm">You don't have any teams. Create one below</Text>
                )}

                <Button component="div" variant="link" mt="md" onClick={() => setIsModalOpen(true)}>
                    Create New Team
                </Button>

                <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
                    {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                    <TeamForm />
                </Modal>
            </Flex>
        </Container>
    );
};

export default UserDashboard;
