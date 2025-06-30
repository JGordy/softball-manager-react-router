import { useEffect, useState } from 'react';

import { useOutletContext } from 'react-router';

import {
    ActionIcon,
    Alert,
    Button,
    Divider,
    Group,
    Text,
} from '@mantine/core';

import {
    IconLogout2,
    IconPencil,
    IconMail, IconPhone,
    IconKey,
} from '@tabler/icons-react';

import useModal from '@/hooks/useModal';

import UpdateContactInfo from '@/forms/UpdateContactInfo';
import UpdatePassword from '@/forms/UpdatePassword';

export default function AccountPanel({ actionData, openLogoutDrawer }) {
    // console.log({ actionData });

    const { user } = useOutletContext();

    const { openModal, closeAllModals } = useModal();

    const [formError, setFormError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
            closeAllModals();
            setFormError(null);
            setActionSuccess(actionData.message);
        }

        if (actionData?.status === 500) {
            setTimeout(() => {
                setFormError(actionData.message);
                setActionSuccess(null);
                closeAllModals();
            }, 300);
        }
    }, [actionData, closeAllModals,]);

    const openUpdateContactInfoModal = () => openModal({
        title: 'Update Contact Information',
        children: (
            <UpdateContactInfo
                actionRoute='/settings'
                user={user}
                defaults={{
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                }}
            />
        ),
    });

    const openUpdatePasswordModal = () => openModal({
        title: 'Update Your Password',
        children: <UpdatePassword actionRoute='/settings' />,
    });

    return (
        <>
            {actionSuccess && (
                <Alert
                    mb="md"
                    variant="light"
                    color="green"
                    title="Success!"
                >
                    {actionSuccess}
                </Alert>
            )}

            {formError && (
                <Alert
                    mb="md"
                    variant="light"
                    color="red"
                    title="Invalid Form Submission"
                >
                    {formError}
                </Alert>
            )}

            <Text size="sm" mb="sm">Authentication</Text>

            <Group justify="space-between">
                <Text>Change Password</Text>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Update Password"
                    style={{ cursor: 'pointer' }}
                    onClick={openUpdatePasswordModal}
                    size="lg"
                >
                    <IconKey size={20} />
                </ActionIcon>
            </Group>

            <Divider my="sm" />

            <Text size="sm" mb="sm">Contact Details</Text>
            <Group justify="space-between">
                <div>
                    <Group align="center" mt="xs">
                        <IconMail />
                        <Text>
                            {user.email || 'No email provided'}
                        </Text>
                    </Group>
                    <Group align="center" mt="xs">
                        <IconPhone />
                        <Text>
                            {user.phoneNumber || 'No phone number provided'}
                        </Text>
                    </Group>
                </div>

                <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Update Contact Information"
                    style={{ cursor: 'pointer' }}
                    onClick={openUpdateContactInfoModal}
                    size="lg"
                >
                    <IconPencil />
                </ActionIcon>
            </Group>

            <Divider my="sm" />

            <Button
                color="red"
                onClick={openLogoutDrawer}
                variant="subtle"
                px="0px"
                size="md"
            >
                <Group gap="xs">
                    <IconLogout2 size={16} mr='xs' />
                    Log out
                </Group>
            </Button>
        </>
    );
}
