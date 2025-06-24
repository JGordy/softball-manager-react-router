import { useState, useEffect } from 'react';
import { useActionData, useOutletContext } from 'react-router';

import {
    Indicator,
    Popover,
    Tabs,
    Text,
} from '@mantine/core';

import {
    IconBallBaseball,
    IconBellRingingFilled,
    IconFriends,
    IconHeadphonesFilled,
    IconHistory,
    IconMail,
    IconPhone,
    IconUserSquareRounded,
} from '@tabler/icons-react';

import { useAuth } from '@/contexts/auth/useAuth';

import UserHeader from '@/components/UserHeader';
import EditButton from '@/components/EditButton';
import PersonalDetails from '@/components/PersonalDetails';
import PlayerDetails from '@/components/PlayerDetails';

import AddPlayer from '@/forms/AddPlayer';
import { updateUser } from '@/actions/users'

import useModal from '@/hooks/useModal';

import AlertIncomplete from './components/AlertIncomplete';

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

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === 'edit-player') {
        return updateUser({ values, userId });
    }
}

export default function UserProfile() {

    const { openModal, closeAllModals } = useModal();

    const { user } = useAuth();
    const { user: player } = useOutletContext();

    const actionData = useActionData();

    const isCurrentUser = user?.$id === player?.$id;

    const incompleteData = Object.entries(fieldsToValidate)
        .filter(([key]) => {
            let value = player[key];
            return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
        })
        .map(([key, data]) => (data));

    const [showIndicator, setShowIndicator] = useState(incompleteData.length > 0);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 204) {
                    closeAllModals();
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

    const openPersonalDetailsModal = () => openModal({
        title: 'Update Personal Details',
        children: renderForm(['name', 'contact', 'gender', 'song']),
    });

    const openPlayerDetailsModal = () => openModal({
        title: 'Update Player Details',
        children: renderForm(['positions', 'throws-bats']),
    });

    const userNotification = isCurrentUser && (
        <Popover position="bottom" withArrow shadow="md">
            <Popover.Target>
                <Indicator inline processing color="red" size={12} disabled={!showIndicator}>
                    <IconBellRingingFilled size={24} />
                </Indicator>
            </Popover.Target>
            <Popover.Dropdown p="0">
                {showIndicator ? (
                    <AlertIncomplete incompleteData={incompleteData} />
                ) : (
                    <Text p="sm">No new notifications or alerts</Text>
                )}
            </Popover.Dropdown>
        </Popover>
    );

    return !!Object.keys(player).length && (
        <>
            <UserHeader subText="Here are your personal and player details">
                {userNotification}
            </UserHeader>

            <Tabs radius="md" defaultValue="player" mt="xl">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="player" leftSection={<IconBallBaseball size={16} />}>
                        Player
                    </Tabs.Tab>
                    <Tabs.Tab value="personal" leftSection={<IconUserSquareRounded size={16} />}>
                        Personal
                    </Tabs.Tab>
                    <Tabs.Tab value="experience" leftSection={<IconHistory size={16} />} disabled>
                        Experience
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="player">
                    <PlayerDetails
                        player={player}
                        editButton={isCurrentUser && <EditButton setIsModalOpen={openPlayerDetailsModal} />}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="personal">
                    <PersonalDetails
                        player={player}
                        editButton={isCurrentUser && <EditButton setIsModalOpen={openPersonalDetailsModal} />}
                        fieldsToDisplay={fieldsToDisplay}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="experience">
                    <Text>Experience</Text>
                </Tabs.Panel>

            </Tabs>
        </>
    );
}