import { useEffect, useState } from 'react';

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
    Text,
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

import { Form, useActionData, redirect } from 'react-router';

import classes from '@/styles/inputs.module.css';

import { account } from '@/appwrite';

import { createTeam } from './action';
import { getTeams } from './loader';

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
    console.warn({ teamList, loaderData });

    const iconProps = {
        color: 'currentColor',
        size: 18,
    };

    const genderIcons = {
        'Men': <IconMan {...iconProps} />,
        'Women': <IconWoman {...iconProps} />,
        'Coed': <IconFriends {...iconProps} />,
    };

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
                    <List size="sm" maw={400} mx="auto">
                        {teamList.map((team, index) => (
                            <List.Item key={index}>
                                {team.teamName} ({team.leagueName})
                            </List.Item>
                        ))}
                    </List>
                )}

                {!teamList.length && (
                    <Text size="sm">You don't have any teams. Create one below</Text>
                )}

                <Button component="a" variant="link" mt="md" onClick={() => setIsModalOpen(true)}>
                    Create New Team
                </Button>

                <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
                    {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                    <Form method="post">
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

export default UserDashboard;
