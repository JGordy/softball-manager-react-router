import { useState, useEffect } from 'react';
import { useActionData } from 'react-router';

import {
    Alert,
    Avatar,
    Button,
    Container,
    Group,
    Modal,
    Text,
    Title,
    useComputedColorScheme,
} from '@mantine/core';

import {
    IconEdit,
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from '@tabler/icons-react';

import AlertIncomplete from './components/AlertIncomplete';
import PersonalDetails from './components/PersonalDetails';
import PersonalDetailsForm from './components/PersonalDetailsForm';
import PlayerDetailsForm from './components/PlayerDetailsForm';
import PlayerDetails from './components/PlayerDetails';

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
    gender: {
        icon: <IconFriends size={20} />,
        label: 'gender',
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: ' walk up song',
    },
};

const fieldsToValidate = {
    ...fieldsToDisplay,
    gender: { label: 'gender' },
    bats: { label: 'bats' },
    preferredPositions: { label: 'preferred positions' },
    dislikedPositions: { label: 'disliked positions' }
}

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

    return { player: userId ? await getProfile({ userId }) : {} }
}

export async function action({ request, params }) {
    return updateUser({ request, params });
}

export default function UserProfile({ loaderData }) {
    const { player } = loaderData;
    console.log({ player });

    const actionData = useActionData();

    const incompleteData = Object.entries({ ...fieldsToValidate })
        .filter(([key]) => {
            let value = player[key];
            return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
        })
        .map(([key, data]) => (data));

    const [showAlert, setShowAlert] = useState(incompleteData.length > 0);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
    const [error, setError] = useState(null);

    const fullName = `${player.firstName} ${player.lastName}`;

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
            <Group justify="space-between" py="lg">
                <Group>
                    <Avatar color="green" name={fullName} alt={fullName} size="md" />
                    <div>
                        <Title order={3}>{`Hello ${player.firstName}!`}</Title>
                        <Text size="0.6rem">Here are your personal and player details</Text>
                    </div>
                </Group>
            </Group>

            {showAlert && (
                <AlertIncomplete handlerAlertClose={handleAlertClose} incompleteData={incompleteData} />
            )}

            <PersonalDetails
                player={player}
                editButton={<EditButton setIsModalOpen={setIsDetailsModalOpen} />}
                fieldsToDisplay={fieldsToDisplay}
            />

            <PlayerDetails
                player={player}
                editButton={<EditButton setIsModalOpen={setIsPositionModalOpen} />}
            />

            <Modal opened={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Update Profile">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <PersonalDetailsForm
                    setIsModalOpen={setIsDetailsModalOpen}
                    setError={setError}
                />
            </Modal>

            <Modal opened={isPositionModalOpen} onClose={() => setIsPositionModalOpen(false)} title="Update Positions">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <PlayerDetailsForm
                    setIsModalOpen={setIsPositionModalOpen}
                    setError={setError}
                />
            </Modal>
        </Container>
    );
}