import { ActionIcon, Card, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import {
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconMessage,
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

export default function PersonalDetails({ player, user, managerView }) {
    const isCurrentUser = user && player && user.$id === player.$id;
    const isTouchDevice = useMediaQuery("(hover: none) and (pointer: coarse)");

    // Handle email field separately
    const emailField = (
        <Card withBorder key="email" my="md" radius="lg">
            <Group justify="space-between">
                <Group>
                    {fields.email.icon}
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
                        {fields.email.icon}
                    </ActionIcon>
                )}
            </Group>
        </Card>
    );

    // Handle phone number field separately
    const phoneField = (
        <Card withBorder key="phoneNumber" my="md" radius="lg">
            <Group justify="space-between">
                <Group>
                    {fields.phoneNumber.icon}
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
                            {fields.phoneNumber.icon}
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
        </Card>
    );

    // Render other fields
    const otherFields = Object.entries({ ...fields })
        .filter(([key]) => key !== "email" && key !== "phoneNumber")
        .map(([key, { icon, label, restricted }]) => {
            const value = player[key];
            if (restricted && !managerView) {
                return null;
            }
            return (
                <Card withBorder key={key} my="md" radius="lg">
                    <Group>
                        {icon}
                        <Text size="md" c={!value ? "red" : ""}>
                            {value || `${label} not listed*`}
                        </Text>
                    </Group>
                </Card>
            );
        });

    return (
        <>
            {(managerView || isCurrentUser) && emailField}
            {(managerView || isCurrentUser) && phoneField}
            {otherFields}
        </>
    );
}
