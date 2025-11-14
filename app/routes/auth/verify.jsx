import { useEffect } from "react";

import { Container, Text, Title } from "@mantine/core";

import { createAdminClient } from "@/utils/appwrite/server";

export async function loader({ request }) {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    const userId = url.searchParams.get("userId");

    if (!secret || !userId) {
        return {
            success: false,
            message: "Missing verification parameters",
        };
    }

    try {
        const { account } = await createAdminClient();
        await account.updateVerification(userId, secret);

        return {
            success: true,
            message: "Account verified successfully! You can now log in.",
        };
    } catch (error) {
        console.error("Verification error:", error);
        return {
            success: false,
            message:
                "Verification failed: " + (error?.message || "Unknown error"),
        };
    }
}

export default function Verify({ loaderData }) {
    const { success, message } = loaderData;

    useEffect(() => {
        if (success) {
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        }
    }, [success]);

    return (
        <Container size="xs" style={{ marginTop: "4rem" }}>
            <Title order={2} mb="md">
                Email Verification
            </Title>
            <Text size="lg" c={success ? "green" : "red"} fw={500}>
                {message}
            </Text>
            {success && (
                <Text size="sm" c="dimmed" mt="md">
                    Redirecting to login page...
                </Text>
            )}
        </Container>
    );
}
