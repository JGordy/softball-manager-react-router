import { useState, useEffect } from 'react';
import { useActionData } from 'react-router';

import {
    Alert,
    Avatar,
    Button,
    Card,
    Container,
    Divider,
    Stack,
    Group,
    List,
    Modal,
    Text,
    Title,
    useComputedColorScheme,
} from '@mantine/core';

import {
    IconEdit,
    // IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from '@tabler/icons-react';

import AlertIncomplete from './components/AlertIncomplete';
import DetailsForm from './components/DetailsForm';
import PositionForm from './components/PositionForm';
import PositionChart from './components/PositionChart';

import { getProfile } from "./loader";
import { updateUser } from './action';

const fieldsToDisplay = {
    email: {
        icon: <IconMail size={20} />,
        label: 'email',
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: 'phone number',
    },
    // gender: {
    //     icon: <IconFriends size={20} />,
    //     label: 'gender',
    // },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: ' walk up song',
    },
};

function EditButton({ setIsModalOpen }) {
    const computedColorScheme = useComputedColorScheme('light');

    return (
        <Button
            variant="subtle"
            color={computedColorScheme === 'light' ? 'black' : 'white'}
            onClick={() => setIsModalOpen(true)}
            p="0"
            autoContrast
        >
            <Group gap="5px">
                <IconEdit size={18} />
                <Text size="sm">
                    Edit
                </Text>
            </Group>
        </Button>
    );
}

export async function loader({ params }) {
    const { userId } = params;
    return userId ? getProfile({ userId }) : {};
}

export async function action({ request, params }) {
    console.log({ request, params });
    return updateUser({ request, params });
}

export default function UserProfile({ loaderData }) {

    const actionData = useActionData();

    const { firstName, lastName, preferredPositions, dislikedPositions, gender, bats, ...restOfData } = loaderData;
    const fullName = `${firstName} ${lastName}`;

    const incompleteData = Object.entries({ ...fieldsToDisplay, preferredPositions: { label: 'preferred positions' } })
        .filter(([key]) => {
            const value = key === 'preferredPositions' ? preferredPositions : restOfData[key];
            return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
        })
        .map(([key, data]) => (data));

    const [showAlert, setShowAlert] = useState(incompleteData.length > 0);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 204) {
                    setError(null);
                    setIsPositionModalOpen(false);
                    setIsDetailsModalOpen(false);
                } else if (actionData instanceof Error) {
                    setError(actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                setError("An error occurred while updating user data.");
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    return (
        <Container>
            {showAlert && (
                <AlertIncomplete handlerAlertClose={handleAlertClose} incompleteData={incompleteData} />
            )}

            <Group mt="sm" mb="lg" justify='space-between'>
                <Title order={2}>My Profile</Title>
            </Group>

            <Card shadow="sm" padding="lg" radius="xl" withBorder>
                <Group justify="space-between">
                    <Group>
                        <Avatar color="green" name={fullName} alt={fullName} size="sm" />
                        {/* <div> */}
                        <Title order={4}>{fullName}</Title>
                        {/* </div> */}
                    </Group>
                    <EditButton setIsModalOpen={setIsDetailsModalOpen} />
                </Group>

                <Divider my="xs" size="sm" />

                <Group justify="space-around" gap="0px">
                    <Stack align="center" gap="0px">
                        <Text size="xs">Gender</Text>
                        <Text size="small" c="green" fw={700} autoContrast>{gender}</Text>
                    </Stack>


                    <Divider orientation="vertical" size="sm" />

                    <Stack align="center" gap="0px">
                        <Text size="xs">Batting</Text>
                        <Text size="small" c="green" fw={700} autoContrast>{bats}</Text>
                    </Stack>
                </Group>

                <Divider my="xs" size="sm" />

                <List
                    spacing="xs"
                    size="sm"
                    center
                >
                    {Object.entries(fieldsToDisplay).map(([key, { icon, label }]) => {
                        const value = restOfData[key];
                        return (
                            <List.Item key={key} icon={icon}>
                                {/* <ThemeIcon size="lg">
                                {icon}
                                </ThemeIcon> */}
                                <Text size="sm" c={!value ? 'red' : ''}>
                                    {value || `${label} not listed*`}
                                </Text>
                            </List.Item>
                        );
                    })}
                </List>
            </Card>

            <PositionChart
                preferredPositions={preferredPositions}
                dislikedPositions={dislikedPositions}
                editButton={<EditButton setIsModalOpen={setIsPositionModalOpen} />}
            />

            <Modal opened={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Update Profile">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <DetailsForm
                    setIsModalOpen={setIsDetailsModalOpen}
                    setError={setError}
                />
            </Modal>

            <Modal opened={isPositionModalOpen} onClose={() => setIsPositionModalOpen(false)} title="Update Positions">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <PositionForm
                    setIsModalOpen={setIsPositionModalOpen}
                    setError={setError}
                />
            </Modal>
        </Container>
    );
}