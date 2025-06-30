import { useNavigate, useOutletContext } from 'react-router';
import { useEffect, useState } from 'react';

import {
    Accordion,
    Button,
    Group,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout2 } from '@tabler/icons-react';

import { account } from '@/appwrite';

// import useModal from '@/hooks/useModal';

import { updateAccountInfo, updatePassword, updateUser } from '@/actions/users';

import DrawerContainer from '@/components/DrawerContainer';
import UserHeader from '@/components/UserHeader';
import AccountPanel from './components/AccountPanel';

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

    const [opened, { open, close }] = useDisclosure(false);

    const [userAccount, setUserAccount] = useState();

    console.log('/settings ', { user, session, userAccount });
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

    const logOutUser = async () => {
        await account.deleteSession(session.$id);
        navigate("/login");
    }

    return (
        <div className="settings-container">
            <UserHeader subText={user.email} />

            <Accordion variant="separated" radius="md" defaultValue="account" mt="xl">

                <Accordion.Item value="account">
                    <Accordion.Control>Account</Accordion.Control>
                    <Accordion.Panel>
                        <AccountPanel
                            actionData={actionData}
                            openLogoutDrawer={open}
                        />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="leagues">
                    <Accordion.Control>Leagues</Accordion.Control>
                    <Accordion.Panel>
                        This feature is under development. Please check back later for updates.
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