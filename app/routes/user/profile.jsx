import { useState } from 'react';

import {
    Alert,
    Avatar,
    Card,
    Container,
    Divider,
    Group,
    List,
    Text,
    Title,
    // ThemeIcon,
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
        icon: <IconMail size={20} />,
        label: 'email',
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: 'phone number',
    },
    gender: {
        icon: <IconFriends size={20} />,
        label: 'gender',
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
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

            <Card shadow="sm" padding="lg" radius="xl" withBorder>
                <Group position="center" mb="lg">
                    <Avatar color="green" name={fullName} alt={fullName} />
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
            </Card>


            <Card shadow="sm" padding="lg" radius="xl" mt="md" withBorder>
                <List
                    spacing="xs"
                    size="sm"
                    center
                >
                    {Object.entries(fieldsToDisplay).map(([key, { icon, label }]) => {
                        const value = restOfData[key];
                        return (
                            <List.Item key={key} icon={icon}>
                                {/* <ThemeIcon size="lg">
                                {icon}
                                </ThemeIcon> */}
                                <Text size="sm" c={!value ? 'red' : ''}>
                                    {value || `${label} not listed*`}
                                </Text>
                            </List.Item>
                        );
                    })}
                </List>
            </Card>


            {showAlert && (
                <Alert
                    mt="20px"
                    autoContrast
                    color="orange"
                    icon={<IconInfoCircle />}
                    onClose={handleAlertClose}
                    radius="xl"
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
        </Container>
    );
}