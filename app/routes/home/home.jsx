import { useState } from 'react';
import {
    Center,
    List,
    Button,
    Modal,
    TextInput,
    Select,
    NumberInput,
    Group,
    Box,
    Title,
    Alert,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

import { IconCalendar } from '@tabler/icons-react';

import { Form } from 'react-router';

import createTeamAction from './action';

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

export async function action({ request }) {
    return createTeamAction({ request });
}

// Example usage (in your route component):
const TeamsPage = ({ loaderData, actionData }) => {
    const teams = loaderData?.teams;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamList, setTeamList] = useState(teams || []);
    const [error, setError] = useState(null);

    const handleAfterSubmit = async (data) => {
        try {
            if (data && data.status === 200) {
                const response = await data.json(); // Parse the JSON from the successful response
                setTeamList((prevTeams) => [...prevTeams, response]); // Update the teams list with the parsed JSON data
                setError(null);
                setIsModalOpen(false); // Close the modal immediately
                navigate('/teams');
            } else if (data instanceof Error) {
                setError(data.message);
            }
        } catch (jsonError) {
            console.error("Error parsing JSON:", jsonError);
            setError("An error occurred during team creation.");
        }
    };

    return (
        <Center>
            <Box mx="auto">
                <Title order={2} mb="sm">
                    Teams
                </Title>
                <List size="sm" striped bordered maw={400} mx="auto">
                    {teamList.map((team, index) => (
                        <List.Item key={index}>
                            {team.teamName} ({team.leagueName})
                        </List.Item>
                    ))}
                </List>

                <Button component="a" variant="link" mt="md" onClick={() => setIsModalOpen(true)}>
                    Create New Team
                </Button>

                <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
                    {error && <Alert type="error" mb="md">{error}</Alert>}
                    <Form method="post" onSubmit={handleAfterSubmit}>
                        <TextInput label="Team Name" name="teamName" required />
                        <TextInput label="League Name" name="leagueName" required />
                        <Select
                            label="Type"
                            name="type"
                            data={['Men\'s', 'Women\'s', 'Coed']}
                            required
                        />
                        <TextInput
                            label="Game Day"
                            name="gameDay"
                        />
                        <NumberInput
                            label="Sign Up Fee"
                            name="signUpFee"
                            min={0}
                        />
                        <DatePickerInput
                            leftSection={<IconCalendar size={18} stroke={1.5} />}
                            label="Season Start Date"
                            name="seasonStart"
                            placeholder="Pick a date"
                        />
                        <DatePickerInput
                            leftSection={<IconCalendar size={18} stroke={1.5} />}
                            label="Season End Date"
                            name="seasonEnd"
                            placeholder="Pick a date"
                        />

                        <Group position="right" mt="md">
                            <Button type="submit">Create Team</Button>
                            <Button
                                variant="outline"
                                color="gray"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setError(null);
                                }}
                            >
                                Cancel
                            </Button>
                        </Group>
                    </Form>
                </Modal>
            </Box>
        </Center>
    );
};

export default TeamsPage;
