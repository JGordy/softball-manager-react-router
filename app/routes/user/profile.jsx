import { useState, useEffect } from 'react';
import { useActionData } from 'react-router';

import {
    Alert,
    Avatar,
    Button,
    Card,
    Container,
    Divider,
    Group,
    List,
    Modal,
    Text,
    Title,
} from '@mantine/core';

import {
    IconInfoCircle,
    IconEdit,
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from '@tabler/icons-react';

import UpdateUserForm from './components/UpdateUserForm';

import { getProfile } from "./loader";
import { updateUser } from './action';
import PositionChart from './components/PositionChart';

const fieldsToDisplay = {
    email: {
        icon: <IconMail size={20} />,
        label: 'email',
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: 'phone number',
    },
    gender: {
        icon: <IconFriends size={20} />,
        label: 'gender',
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: ' walk up song',
    },
};

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

    const { firstName, lastName, preferredPositions, ...restOfData } = loaderData;
    const fullName = `${firstName} ${lastName}`;

    const incompleteData = Object.entries({ ...fieldsToDisplay, preferredPositions: { label: 'preferred positions' } })
        .filter(([key]) => {
            const value = key === 'preferredPositions' ? preferredPositions : restOfData[key];
            return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
        })
        .map(([key, data]) => (data));

    const [showAlert, setShowAlert] = useState(incompleteData.length > 0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 204) {
                    setError(null);
                    setIsModalOpen(false);
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
            <Group mt="sm" mb="lg" justify='space-between'>
                <Title order={2}>My Profile</Title>
                <Group gap="5px">
                    <Button variant="subtle" color="white" onClick={() => setIsModalOpen(true)}>
                        <IconEdit size={18} />
                        <Text size="sm">
                            Edit
                        </Text>
                    </Button>
                </Group>
            </Group>

            <Card shadow="sm" padding="lg" radius="xl" withBorder>
                <Group position="center" mb="lg">
                    <Avatar color="green" name={fullName} alt={fullName} />
                    <div>
                        <Title order={3}>{fullName}</Title>
                    </div>
                </Group>

                <Divider my="md" />

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

            <PositionChart preferredPositions={preferredPositions} />

            {showAlert && (
                <Alert
                    mt="20px"
                    autoContrast
                    color="orange"
                    icon={<IconInfoCircle />}
                    onClose={handleAlertClose}
                    radius="xl"
                    title="Your profile is incomplete!"
                    withCloseButton={true}
                >
                    <p>Please provide the following information:</p>
                    <ol>
                        {incompleteData?.map(({ label }) => (
                            <li key={label}>{label}</li>
                        ))}
                    </ol>
                </Alert>
            )}

            <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Profile">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <UpdateUserForm
                    setIsModalOpen={setIsModalOpen}
                    setError={setError}
                    user={loaderData}
                />
            </Modal>
        </Container>
    );
}