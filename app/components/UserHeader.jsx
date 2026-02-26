import { useState } from "react";
import { useOutletContext, useFetcher } from "react-router";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Flex,
    Group,
    Stack,
    Text,
    Title,
    useMantineTheme,
} from "@mantine/core";

import { IconRosetteDiscountCheckFilled } from "@tabler/icons-react";
import classes from "@/styles/userHeader.module.css";
import UserStatsRow from "./UserStatsRow";

export default function UserHeader({ children, subText, stats }) {
    const context = useOutletContext();
    const { user, isVerified, isDesktop = false } = context || {};
    const theme = useMantineTheme();

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
        <Box pos="relative" mt="md" mb={isDesktop ? "xl" : "lg"}>
            {!isDesktop && children && (
                <Box pos="absolute" top={0} right={0} style={{ zIndex: 10 }}>
                    {children}
                </Box>
            )}

            {isDesktop ? (
                <Flex direction="row" align="center" justify="space-between">
                    <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                        <Box className={classes.avatarWrapper}>
                            <div className={classes.ring} />
                            <Avatar
                                src={user?.prefs?.avatarUrl}
                                color="lime"
                                name={user?.name}
                                alt={user?.name}
                                size={80}
                                radius="100%"
                            />
                        </Box>

                        <Stack align="flex-start" gap={2}>
                            <Title order={2} className={classes.name}>
                                <Group gap={4} justify="flex-start">
                                    {`Hello, ${user?.name?.split(" ")?.[0]}!`}
                                    {isVerified && (
                                        <IconRosetteDiscountCheckFilled
                                            size={20}
                                            color={theme.colors.blue[6]}
                                            className={classes.verifiedIcon}
                                        />
                                    )}
                                </Group>
                            </Title>
                            {subText && (
                                <Text
                                    size="sm"
                                    fw={500}
                                    className={classes.subText}
                                >
                                    {subText}
                                </Text>
                            )}
                        </Stack>
                    </Group>

                    <Box
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        {stats && <UserStatsRow stats={stats} />}
                    </Box>

                    <Group justify="flex-end" style={{ flex: 1 }}>
                        {children}
                    </Group>
                </Flex>
            ) : (
                <Stack align="center" gap="md">
                    <Box className={classes.avatarWrapper}>
                        <div className={classes.ring} />
                        <Avatar
                            src={user?.prefs?.avatarUrl}
                            color="lime"
                            name={user?.name}
                            alt={user?.name}
                            size={80}
                            radius="100%"
                        />
                    </Box>

                    <Stack align="center" gap={2}>
                        <Title order={2} className={classes.name}>
                            <Group gap={4} justify="center">
                                {`Hello, ${user?.name?.split(" ")?.[0]}!`}
                                {isVerified && (
                                    <IconRosetteDiscountCheckFilled
                                        size={20}
                                        color={theme.colors.blue[6]}
                                        className={classes.verifiedIcon}
                                    />
                                )}
                            </Group>
                        </Title>
                        {subText && (
                            <Text
                                size="sm"
                                fw={500}
                                className={classes.subText}
                            >
                                {subText}
                            </Text>
                        )}
                    </Stack>

                    {stats && <UserStatsRow stats={stats} />}
                </Stack>
            )}

            {!isVerified && (
                <Alert
                    mt="md"
                    variant="light"
                    color="red"
                    title="Email not yet verified"
                    style={{ width: "100%" }}
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
        </Box>
    );
}
