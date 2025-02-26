import { useState, useEffect } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import {
    Avatar,
    Container,
    Group,
    Indicator,
    Popover,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import {
    IconBellRingingFilled,
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from '@tabler/icons-react';

import { useAuth } from '@/contexts/auth/useAuth';

import EditButton from '@/components/EditButton';
import PersonalDetails from '@/components/PersonalDetails';
import PlayerDetails from '@/components/PlayerDetails';

import AddPlayer from '@/forms/AddPlayer';

import AlertIncomplete from './components/AlertIncomplete';

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
        label: 'walk up song',
    },
};

const fieldsToValidate = {
    ...fieldsToDisplay,
    gender: { label: 'gender' },
    bats: { label: 'bats' },
    throws: { label: 'throws' },
    preferredPositions: { label: 'preferred positions' },
    dislikedPositions: { label: 'disliked positions' }
}

export async function loader({ params }) {
    const { userId } = params;

    try {
        if (userId) {
            const player = await getProfile({ userId });
            return { player }
        }
        return { player: {} };
    } catch (error) {
        return { player: {} };
    }
}

export async function action({ request, params }) {
    return updateUser({ request, params });
}

export default function UserProfile() {

    const { user } = useAuth();
    // console.log('profile: ', { user });

    const { player } = useLoaderData();
    const actionData = useActionData();

    const isCurrentUser = user?.$id === player?.$id;

    const incompleteData = Object.entries(fieldsToValidate)
        .filter(([key]) => {
            let value = player[key];
            return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
        })
        .map(([key, data]) => (data));

    const [showIndicator, setShowIndicator] = useState(incompleteData.length > 0);

    const fullName = `${player.firstName} ${player.lastName}`;

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 204) {
                    modals.closeAll();
                } else if (actionData instanceof Error) {
                    console.error("An error occurred while updating user data", actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const renderForm = (inputs) => (
        <AddPlayer
            action="edit-player"
            actionRoute={`/user/${user.$id}`}
            confirmText="Update Details"
            inputsToDisplay={inputs}
        />
    );

    const openPersonalDetailsModal = () => modals.open({
        title: 'Update Personal Details',
        children: renderForm(['name', 'contact', 'gender', 'song']),
    });

    const openPlayerDetailsModal = () => modals.open({
        title: 'Update Player Details',
        children: renderForm(['positions', 'throws-bats']),
    });

    return !!Object.keys(player).length && (
        <Container>
            <Group justify="space-between" py="lg">
                <Group>
                    <Avatar color="green" name={fullName} alt={fullName} size="md" />
                    <div>
                        <Title order={3}>{`Hello ${player.firstName}!`}</Title>
                        <Text size="0.6rem">Here are your personal and player details</Text>
                    </div>
                </Group>

                {isCurrentUser && (
                    <Popover position="bottom" withArrow shadow="md">
                        <Popover.Target>
                            <Indicator inline processing color="red" size={12} disabled={!showIndicator}>
                                <IconBellRingingFilled size={24} />
                            </Indicator>
                        </Popover.Target>
                        <Popover.Dropdown>
                            {showIndicator ? (
                                <AlertIncomplete incompleteData={incompleteData} />
                            ) : (
                                <Text>No new notifications or alerts</Text>
                            )}
                        </Popover.Dropdown>
                    </Popover>
                )}
            </Group>

            <PersonalDetails
                player={player}
                editButton={isCurrentUser && <EditButton setIsModalOpen={openPersonalDetailsModal} />}
                fieldsToDisplay={fieldsToDisplay}
            />

            <PlayerDetails
                player={player}
                editButton={isCurrentUser && <EditButton setIsModalOpen={openPlayerDetailsModal} />}
            />
        </Container>
    );
}