import { useNavigate, useOutletContext, useActionData } from 'react-router';
import { useEffect, useState } from 'react';

import {
    Accordion,
    Alert,
    Button,
    Divider,
    Group,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout2, IconPencil, IconMail, IconPhone, IconKey } from '@tabler/icons-react';

import { account } from '@/appwrite';

import useModal from '@/hooks/useModal';

import { updateAccountInfo, updateUser } from '@/actions/users';

import UpdateContactInfo from '@/forms/UpdateContactInfo';

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

    return null;
};

export default function Settings({ actionData }) {

    const { user, session } = useOutletContext();

    const navigate = useNavigate();

    const { openModal, closeAllModals } = useModal();

    const [opened, { open, close }] = useDisclosure(false);

    const [userAccount, setUserAccount] = useState();
    const [formError, setFormError] = useState(null);

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
                        <Group justify="space-between">
                            <Text size="sm">Update Password</Text>
                            <IconKey
                                style={{ cursor: 'pointer' }}
                                onClick={() => { }}
                            />
                        </Group>

                        <Divider my="sm" />

                        <Group justify="space-between">
                            <Text size="sm">Contact Details</Text>
                            <IconPencil
                                style={{ cursor: 'pointer' }}
                                onClick={openUpdateContactInfoModal}
                            />
                        </Group>

                        <Group align="center" mt="md">
                            <IconMail />
                            <Text>
                                {user.email || 'No email provided'}
                            </Text>
                        </Group>
                        <Group align="center" mt="md">
                            <IconPhone />
                            <Text>
                                {user.phoneNumber || 'No phone number provided'}
                            </Text>
                        </Group>

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