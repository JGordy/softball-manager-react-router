import { useNavigate, useOutletContext } from 'react-router';
import { useEffect, useState } from 'react';

import {
    Accordion,
    ActionIcon,
    Alert,
    Button,
    Divider,
    Group,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout2, IconPencil, IconMail, IconPhone, IconKey } from '@tabler/icons-react';

import { account } from '@/appwrite';

import useModal from '@/hooks/useModal';

import { updateAccountInfo, updatePassword, updateUser } from '@/actions/users';

import UpdateContactInfo from '@/forms/UpdateContactInfo';
import UpdatePassword from '@/forms/UpdatePassword';

import DrawerContainer from '@/components/DrawerContainer';
import UserHeader from '@/components/UserHeader';

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === 'update-profile-info') {
        return updateUser({ userId, values });
    }

    return null;
}

export async function clientAction({ request, params }) {
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === 'update-contact') {
        return updateAccountInfo({ values });
    }

    if (_action === 'update-password') {
        return updatePassword({ values });
    }

    return null;
};

export default function Settings({ actionData }) {

    const { user, session } = useOutletContext();

    const navigate = useNavigate();

    const { openModal, closeAllModals } = useModal();

    const [opened, { open, close }] = useDisclosure(false);

    const [userAccount, setUserAccount] = useState();
    const [formError, setFormError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(false);

    console.log({ user, session, userAccount });
    // console.log({
    //     accountCompare: {
    //         user: {
    //             email: user?.email,
    //             phoneNumber: user?.phoneNumber,
    //         },
    //         userAccount: {
    //             email: userAccount?.email,
    //             phoneNumber: userAccount?.phone,
    //         },
    //     },
    // });

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

    useEffect(() => {
        const getUserAccount = async () => {
            try {
                const _userAccount = await account.get();
                setUserAccount(_userAccount);
            } catch (error) {
                console.error("Error fetching user account:", error);
            }
        };
        if ((user && !userAccount) || (user?.email !== userAccount?.email)) {
            getUserAccount();
        }
    }, [account, user.email])

    useEffect(() => {
        if (actionData?.success) {
            closeAllModals();
            setFormError(null);
            setActionSuccess(actionData.message);
        }

        if (actionData?.status === 500) {
            setTimeout(() => {
                setFormError(actionData.message);
                closeAllModals();
            }, 300);
        }
    }, [actionData, closeAllModals,]);

    const logOutUser = async () => {
        await account.deleteSession(session.$id);
        navigate("/login");
    }

    return (
        <div className="settings-container">
            <UserHeader subText={user.email} />

            <Accordion variant="separated" radius="md" defaultValue="account" mt="xl">

                <Accordion.Item value="leagues">
                    <Accordion.Control>Leagues</Accordion.Control>
                    <Accordion.Panel>
                        This feature is under development. Please check back later for updates.
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="account">
                    <Accordion.Control>Account</Accordion.Control>
                    <Accordion.Panel>
                        {actionSuccess && (
                            <Alert
                                mt="md"
                                variant="light"
                                color="green"
                                title="Success!"
                            >
                                {actionSuccess}
                            </Alert>
                        )}

                        {formError && (
                            <Alert
                                mt="md"
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
                            onClick={open}
                            variant="subtle"
                            px="0px"
                            size="md"
                        >
                            <Group gap="xs">
                                <IconLogout2 size={16} mr='xs' />
                                Log out
                            </Group>
                        </Button>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <DrawerContainer
                opened={opened}
                onClose={close}
                title="Confirm Log Out"
            >
                <Text size="md" mb="xl">
                    Are you sure you want to log out? You will need to log in again to access your content.
                </Text>
                <Button
                    color="red"
                    onClick={logOutUser}
                    variant="filled"
                    size="md"
                    fullWidth
                >
                    <Group gap="xs">
                        <IconLogout2 size={16} mr='xs' />
                        Yes, Log out
                    </Group>
                </Button>
            </DrawerContainer>
        </div>
    );
};