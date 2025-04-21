import { useOutletContext } from 'react-router';

import { Avatar, Group, Text, Title } from '@mantine/core';

import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react';

export default function UserHeader({ subText }) {
    const context = useOutletContext();
    const { user, isVerified } = context;
    console.log('UserHeader', { context });
    const fullName = `${user.firstName} ${user.lastName}`;

    return (
        <>
            <Group my="md">
                <Avatar color="green" name={fullName} alt={fullName} size="md" />
                <div>
                    <Title order={3}>
                        <Group gap="0px">
                            {`Hello, ${user.firstName}!`}
                            {isVerified && <IconRosetteDiscountCheckFilled size={16} color="green" />}
                        </Group>
                    </Title>
                    {subText && <Text size="0.8rem">{subText}</Text>}
                </div>
            </Group>

            {!isVerified && (
                <Text mt="md" c="red">
                    Your email is not verified. Please check your inbox for a verification email.
                </Text>
            )}
        </>
    );
}