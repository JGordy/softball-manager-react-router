import { Card, Group, List, Text } from "@mantine/core";

import {
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from "@tabler/icons-react";

const fields = {
    email: {
        icon: <IconMail size={20} />,
        label: "email",
        restricted: true,
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: "phone number",
        restricted: true,
    },
    gender: {
        icon: <IconFriends size={20} />,
        label: "gender",
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: "walk up song",
    },
};

export default function PersonalDetails({
    player,
    fieldsToDisplay,
    managerView,
}) {
    return (
        <Card my="md" radius="lg" withBorder>
            <Group justify="space-between" align="start">
                <List spacing="xs" size="sm" mt="8px" center>
                    {Object.entries({ ...fields, ...fieldsToDisplay }).map(
                        ([key, { icon, label, restricted }]) => {
                            const value = player[key];
                            if (restricted && !managerView) {
                                return null;
                            }
                            return (
                                <List.Item key={key} icon={icon}>
                                    <Text size="sm" c={!value ? "red" : ""}>
                                        {value || `${label} not listed*`}
                                    </Text>
                                </List.Item>
                            );
                        },
                    )}
                </List>
            </Group>
        </Card>
    );
}
