import {
    Card,
    Divider,
    Group,
    List,
    Text,
    Title,
} from "@mantine/core";

import {
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from '@tabler/icons-react';

const fields = {
    email: {
        icon: <IconMail size={20} />,
        label: 'email',
        restricted: true,
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: 'phone number',
        restricted: true,
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

export default function DetailCard({ editButton, player, fieldsToDisplay, managerView }) {

    return (
        <Card shadow="sm" padding="lg" radius="xl" withBorder>
            <Group justify="space-between">
                <Group>
                    <Title order={4}>Personal Details</Title>
                </Group>
                {editButton}
            </Group>

            <Divider my="xs" size="sm" />

            <List
                spacing="xs"
                size="sm"
                center
            >
                {Object.entries({ ...fields, ...fieldsToDisplay }).map(([key, { icon, label, restricted }]) => {
                    const value = player[key];
                    if (restricted && !managerView) {
                        return null;
                    }
                    return (
                        <List.Item key={key} icon={icon}>
                            <Text size="sm" c={!value ? 'red' : ''}>
                                {value || `${label} not listed*`}
                            </Text>
                        </List.Item>
                    );
                })}
            </List>
        </Card>
    );
};