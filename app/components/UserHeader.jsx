import { useState } from 'react';
import { useOutletContext } from 'react-router';

import { Alert, Avatar, Button, Group, Text, Title } from '@mantine/core';

import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react';

import { account } from '@/appwrite';

export default function UserHeader({
    children,
    subText,
}) {

    const context = useOutletContext();
    const { user, isVerified } = context;

    const [emailSent, setEmailSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fullName = `${user.firstName} ${user.lastName}`;

    const handleReverificationEmailClick = async () => {
        setIsLoading(true);
        const currentUrl = new URL(window.location.href);
        await account.createVerification(`${currentUrl.origin}/verify`);

        setEmailSent(true);

        setTimeout(() => setIsLoading(false), 1000);
    }

    return (
        <>
            <Group justify="space-between">
                <Group my="md">
                    <Avatar color="green" name={fullName} alt={fullName} size="lg" />
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
                {children}
            </Group>

            {!isVerified && (
                <Alert
                    mt="md"
                    variant="light"
                    color="red"
                    title="Email not yet verified"
                >
                    Your email is not verified and certain features may not be available until complete. Please check your inbox for a verification email.
                    <Button
                        variant="filled"
                        size="xs"
                        color="red"
                        mt="md"
                        loading={isLoading}
                        fullWidth
                        onClick={handleReverificationEmailClick}
                        disabled={emailSent}
                    >
                        {emailSent ? 'Email Sent!' : 'Resend Verification Email'}
                    </Button>
                </Alert>
            )}
        </>
    );
}