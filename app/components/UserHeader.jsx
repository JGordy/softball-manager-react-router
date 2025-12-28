import { useState } from "react";
import { useOutletContext, useFetcher } from "react-router";

import { Alert, Avatar, Button, Group, Text, Title } from "@mantine/core";

import { IconRosetteDiscountCheckFilled } from "@tabler/icons-react";

export default function UserHeader({ children, subText }) {
    const context = useOutletContext();
    const { user, isVerified } = context;

    const [emailSent, setEmailSent] = useState(false);
    const fetcher = useFetcher();

    const handleReverificationEmailClick = () => {
        fetcher.submit(
            {},
            { method: "post", action: "/api/resend-verification" },
        );
        setEmailSent(true);
    };

    return (
        <>
            <Group justify="space-between">
                <Group my="md">
                    <Avatar
                        src={user?.prefs?.avatarUrl}
                        color="green"
                        name={user?.name}
                        alt={user?.name}
                        size="lg"
                    />
                    <div>
                        <Title order={3}>
                            <Group gap="0px">
                                {`Hello, ${user?.name?.split(" ")?.[0]}!`}
                                {isVerified && (
                                    <IconRosetteDiscountCheckFilled
                                        size={16}
                                        color="green"
                                    />
                                )}
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
                    Your email is not verified and certain features may not be
                    available until complete. Please check your inbox for a
                    verification email.
                    <Button
                        variant="filled"
                        size="xs"
                        color="red"
                        mt="md"
                        loading={fetcher.state === "submitting"}
                        fullWidth
                        onClick={handleReverificationEmailClick}
                        disabled={emailSent}
                    >
                        {emailSent
                            ? "Email Sent!"
                            : "Resend Verification Email"}
                    </Button>
                </Alert>
            )}
        </>
    );
}
