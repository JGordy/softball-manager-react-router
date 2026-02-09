import { ActionIcon, Card, Divider, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Fragment } from "react";

import {
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconMessage,
    IconPhone,
} from "@tabler/icons-react";

const managerFields = {
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
};

const fields = {
    gender: {
        icon: <IconFriends size={20} />,
        label: "gender",
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: "walk up song",
    },
};

export default function PersonalDetails({ player, user, managerView }) {
    const isCurrentUser = user && player && user.$id === player.$id;
    const isTouchDevice = useMediaQuery("(hover: none) and (pointer: coarse)");

    // Handle email field separately
    const renderEmailField = ({ icon }) => (
        <Group key="email" justify="space-between" my="sm">
            <Group>
                {icon}
                <Text size="md" c={!player.email ? "red" : ""}>
                    {player.email || "email not listed*"}
                </Text>
            </Group>
            {!isCurrentUser && player.email && (
                <ActionIcon
                    component="a"
                    href={`mailto:${player.email}`}
                    variant="light"
                    aria-label="Send email"
                    radius="xl"
                    size="lg"
                >
                    {icon}
                </ActionIcon>
            )}
        </Group>
    );

    // Handle phone number field separately
    const renderPhoneField = ({ icon }) => (
        <Group key="phoneNumber" justify="space-between" my="sm">
            <Group>
                {icon}
                <Text size="md" c={!player.phoneNumber ? "red" : ""}>
                    {player.phoneNumber || "phone number not listed*"}
                </Text>
            </Group>
            {!isCurrentUser && player.phoneNumber && isTouchDevice && (
                <Group gap="xs">
                    <ActionIcon
                        component="a"
                        href={`tel:${player.phoneNumber}`}
                        variant="light"
                        aria-label="Call phone number"
                        radius="xl"
                        size="lg"
                    >
                        {icon}
                    </ActionIcon>
                    <ActionIcon
                        component="a"
                        href={`sms:${player.phoneNumber}`}
                        variant="light"
                        aria-label="Send text message"
                        radius="xl"
                        size="lg"
                    >
                        <IconMessage size={20} />
                    </ActionIcon>
                </Group>
            )}
        </Group>
    );

    const items = [];

    if (managerView || isCurrentUser) {
        Object.keys(managerFields).forEach((key) => {
            const field = managerFields[key];
            if (key === "email") items.push(renderEmailField(field));
            if (key === "phoneNumber") items.push(renderPhoneField(field));
        });
    }

    Object.entries(fields).forEach(([key, { icon, label, restricted }]) => {
        const value = player[key];
        if (restricted && !managerView) {
            return;
        }
        items.push(
            <Group key={key} my="sm">
                {icon}
                <Text size="md" c={!value ? "red" : ""}>
                    {value || `${label} not listed*`}
                </Text>
            </Group>,
        );
    });

    return (
        <Card radius="lg" mt="sm" withBorder>
            {items.map((item, index) => (
                <Fragment key={item.key || index}>
                    {item}
                    {index < items.length - 1 && <Divider />}
                </Fragment>
            ))}
        </Card>
    );
}
