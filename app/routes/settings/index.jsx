import { useNavigate, useOutletContext } from 'react-router';
import {
    Button,
    Divider,
    Group,
    Text,
} from '@mantine/core';

import { IconLogout2 } from '@tabler/icons-react';

import { account } from '@/appwrite';

import UserHeader from '@/components/UserHeader';

export default function Settings() {
    const { user, session } = useOutletContext();
    console.log({ user, session });

    const navigate = useNavigate();

    const logOutUser = async () => {
        await account.deleteSession(session.$id);
        navigate("/login");
    }

    return (
        <div className="settings-container">
            <UserHeader subText={user.email} />

            <Divider my="sm" />
            <Text>Account</Text>

            <Divider my="sm" />
            <Text>Leagues</Text>

            <Divider my="sm" />
            <Button
                color="red"
                onClick={logOutUser}
                variant="subtle"
                px="0"
                size="md"
            >
                <Group gap="xs">
                    <IconLogout2 size={16} mr='xs' />
                    Log out
                </Group>
            </Button>
        </div>
    );
};