import { useState } from 'react';

import {
    Alert,
    Box,
    Button,
    Center,
    ColorInput,
    Group,
    List,
    Modal,
    NumberInput,
    Select,
    TextInput,
    Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

import {
    IconCalendar,
    IconCurrencyDollar,
    IconFriends,
    IconMan,
    IconWoman,
} from '@tabler/icons-react';

import { Form } from 'react-router';

import classes from '@/styles/inputs.module.css';

import { createTeamAction } from './action';

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

export async function action({ request }) {
    console.log('Home > action', { request });
    return createTeamAction({ request });
}

// Example usage (in your route component):
const TeamsPage = ({ loaderData, actionData }) => {
    const teams = loaderData?.teams;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamList, setTeamList] = useState(teams || []);
    const [error, setError] = useState(null);

    const iconProps = {
        color: 'currentColor',
        size: 18,
    };

    const genderIcons = {
        'Men': <IconMan {...iconProps} />,
        'Women': <IconWoman {...iconProps} />,
        'Coed': <IconFriends {...iconProps} />,
    };

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
                        <TextInput
                            className={classes.inputs}
                            label="Team Name"
                            name="name"
                            placeholder='What do you call yourselves?'
                            required
                        />
                        <TextInput
                            className={classes.inputs}
                            label="League Name"
                            name="leagueName"
                            placeholder='Super rad weekend league'
                            required
                        />
                        <Select
                            className={classes.inputs}
                            label="Gender mix"
                            name="genderMix"
                            placeholder="Choose the league's gender composition"
                            data={['Men', 'Women', 'Coed']}
                            renderOption={({ option }) => (
                                <Group flex="1" gap="xs">
                                    {genderIcons[option.value]}
                                    {option.label}
                                </Group>
                            )}
                            required
                        />
                        <Select
                            className={classes.inputs}
                            label="Game Days"
                            name="gameDays"
                            placeholder="Day of the week"
                            data={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
                        />
                        <ColorInput
                            className={classes.inputs}
                            label="Primary Color"
                            placeholder="White"
                            name="primaryColor"
                        />
                        <NumberInput
                            className={classes.inputs}
                            label="Sign Up Fee"
                            name="signUpFee"
                            clampBehavior="strict"
                            leftSection={<IconCurrencyDollar size={18} />}
                            min={0}
                            max={200}
                            defaultValue={50}
                            step={5}
                        />
                        <DatePickerInput
                            className={classes.inputs}
                            leftSection={<IconCalendar size={18} stroke={1.5} />}
                            label="Season Start Date"
                            name="seasonStartDate"
                            placeholder="Pick a date"
                        />
                        <DatePickerInput
                            className={classes.inputs}
                            leftSection={<IconCalendar size={18} stroke={1.5} />}
                            label="Season End Date"
                            name="seasonEndDate"
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
