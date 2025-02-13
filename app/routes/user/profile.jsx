import { useState } from 'react';

import {
    Alert,
    Avatar,
    Container,
    Divider,
    Group,
    Text,
    Title,
    ThemeIcon,
    Stack,
} from '@mantine/core';

import {
    IconInfoCircle,
    IconMail,
    IconFriends,
    IconHeadphonesFilled,
    IconPhone,
} from '@tabler/icons-react';

import { getProfile } from "./loader";

const fieldsToDisplay = {
    email: {
        icon: <IconMail size={28} />,
        label: 'email',
    },
    phoneNumber: {
        icon: <IconPhone size={28} />,
        label: 'phone number',
    },
    gender: {
        icon: <IconFriends size={28} />,
        label: 'gender',
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={28} />,
        label: ' walk up song',
    },
};

export async function loader({ params }) {
    const { userId } = params;
    return userId ? getProfile({ userId }) : {};
}

export async function action({ request, params }) {
    console.log({ request, params });
}

export default function UserProfile({ loaderData }) {
    // console.log({ loaderData });
    const { firstName, lastName, preferredPositions, ...restOfData } = loaderData;
    const fullName = `${firstName} ${lastName}`;

    const incompleteData = Object.entries({ ...fieldsToDisplay, preferredPositions: { label: 'preferred positions' } })
        .filter(([key]) => {
            const value = restOfData[key];
            return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
        })
        .map(([key, data]) => (data));

    const [showAlert, setShowAlert] = useState(incompleteData.length > 0);

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    return (
        <Container>
            <Title order={2} align="center" mt="sm" mb="lg">My Profile</Title>
            {showAlert && (
                <Alert
                    mb="20px"
                    autoContrast
                    color="orange"
                    icon={<IconInfoCircle />}
                    onClose={handleAlertClose}
                    radius="md"
                    title="Your profile is incomplete!"
                    withCloseButton={true}
                >
                    <p>Please provide the following information:</p>
                    <ol>
                        {incompleteData?.map(({ label }) => (
                            <li key={label}>{label}</li>
                        ))}
                    </ol>
                </Alert>
            )}

            <Group position="center" mb="lg">
                <Avatar color="initials" name={fullName} alt={fullName} />
                <div>
                    <Title order={3}>{fullName}</Title>
                </div>
            </Group>

            <Divider my="md" />

            <Stack>
                <Title order={4}>Preferred Positions</Title>
                <Group position="center" mb="lg">
                    {!preferredPositions.length ? (
                        <Text c="red">None listed*</Text>
                    ) : preferredPositions?.map(position => (
                        <Avatar color="initials" name={position} alt={position} key={position} />
                    ))}
                </Group>
            </Stack>

            <Divider my="md" />

            <Stack spacing="xs">
                {Object.entries(fieldsToDisplay).map(([key, { icon, label }]) => {
                    const value = restOfData[key];
                    return (
                        <Group spacing="xs">
                            {/* <ThemeIcon size="lg"> */}
                            {icon}
                            {/* </ThemeIcon> */}
                            <Text size="md" c={!value ? 'red' : ''}>
                                {value || `${label} not listed*`}
                            </Text>
                        </Group>
                    );
                })}
            </Stack>
        </Container>
    );
}