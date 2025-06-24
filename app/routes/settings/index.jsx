import { useNavigate, useOutletContext } from 'react-router';

import {
    Button,
    Divider,
    Drawer,
    Group,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { IconLogout2 } from '@tabler/icons-react';

import { account } from '@/appwrite';

import UserHeader from '@/components/UserHeader';

export default function Settings() {
    const { user, session } = useOutletContext();
    console.log({ user, session });

    const navigate = useNavigate();

    const [opened, { open, close }] = useDisclosure(false);

    const logOutUser = async () => {
        await account.deleteSession(session.$id);
        navigate("/login");
    }

    return (
        <div className="settings-container">
            <UserHeader subText={user.email} />

            <Divider my="sm" />
            <Text>Leagues</Text>

            <Divider my="sm" />
            <Text>Account</Text>

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

            <Drawer
                opened={opened}
                onClose={close}
                title="Confirm Log Out"
                position="bottom"
                radius="xl"
                padding="xl"
                zIndex={5000}
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
            </Drawer>
        </div>
    );
};