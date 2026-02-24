import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";

import { Container, Text, Title, Loader, Center, Stack } from "@mantine/core";

import { account } from "@/utils/appwrite/client";

export async function loader({ request }) {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const userId = url.searchParams.get("userId");

    return { secret, userId };
}

export default function Verify({ loaderData }) {
    const { secret, userId } = loaderData;
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("Verifying your email...");
    const verifyAttempted = useRef(false);

    useEffect(() => {
        if (verifyAttempted.current) return;

        if (!secret || !userId) {
            setStatus("error");
            setMessage("Missing verification parameters");
            return;
        }

        // Mark as attempted to prevent double-execution in Strict Mode
        verifyAttempted.current = true;

        const verify = async () => {
            try {
                await account.updateVerification(userId, secret);
                setStatus("success");
                setMessage(
                    "Account verified successfully! You can now log in.",
                );

                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } catch (error) {
                console.error("Verification error:", error);
                setStatus("error");
                setMessage(
                    "Verification failed: " +
                        (error?.message || "Unknown error"),
                );
            }
        };

        verify();
    }, [secret, userId, navigate]);

    return (
        <Container size="xs" style={{ marginTop: "4rem" }}>
            <Stack align="center">
                <Title order={2} mb="md">
                    Email Verification
                </Title>

                {status === "verifying" && (
                    <Center>
                        <Loader size="sm" mr="sm" />
                        <Text size="lg">Verifying...</Text>
                    </Center>
                )}

                {status !== "verifying" && (
                    <Text
                        size="lg"
                        c={status === "success" ? "lime" : "red"}
                        fw={500}
                    >
                        {message}
                    </Text>
                )}

                {status === "success" && (
                    <Text size="sm" c="dimmed" mt="md">
                        Redirecting to login page...
                    </Text>
                )}
            </Stack>
        </Container>
    );
}
