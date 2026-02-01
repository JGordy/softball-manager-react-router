import { useEffect } from "react";
import { Link, useActionData, Form } from "react-router";
import { Alert, Button, Container, Paper, Text, Title } from "@mantine/core";
import {
    IconRosetteDiscountCheckFilled,
    IconExclamationCircleFilled,
} from "@tabler/icons-react";

import branding from "@/constants/branding";
import AutocompleteEmail from "@/components/AutocompleteEmail";
import { createAdminClient } from "@/utils/appwrite/server";
import { redirectIfAuthenticated } from "./utils/redirectIfAuthenticated";

export function meta() {
    return [
        { title: `Forgot Password | ${branding.name}` },
        {
            name: "description",
            content: "Recover your account password.",
        },
    ];
}

export async function loader({ request }) {
    return await redirectIfAuthenticated(request);
}

export async function action({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");

    if (!email) {
        return { success: false, message: "Email is required" };
    }

    const { account } = createAdminClient();
    const url = new URL(request.url);
    // Construct the recovery URL (points to /recovery)
    const recoveryUrl = `${url.origin}/recovery`;

    try {
        await account.createRecovery(email, recoveryUrl);
        return {
            success: true,
            message:
                "If an account with this email exists, a recovery link has been sent.",
        };
    } catch (error) {
        console.error("Recovery request error:", error);
        // We generally shouldn't reveal if the email exists or not usually, but for this app simplistic error handling:
        return {
            success: false,
            message: error.message || "Unable to send recovery email.",
        };
    }
}

export default function ForgotPassword() {
    const actionData = useActionData();

    return (
        <Container size={420} my={40}>
            <Title ta="center">Forgot Password?</Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Enter your email to get a reset link
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                {actionData?.message && (
                    <Alert
                        variant="light"
                        color={actionData.success ? "green" : "red"}
                        title={actionData.success ? "Email Sent" : "Error"}
                        icon={
                            actionData.success ? (
                                <IconRosetteDiscountCheckFilled size={16} />
                            ) : (
                                <IconExclamationCircleFilled size={16} />
                            )
                        }
                        mb="md"
                    >
                        {actionData.message}
                    </Alert>
                )}

                <Form method="post">
                    <AutocompleteEmail required />
                    <Button fullWidth mt="xl" type="submit" color="green">
                        Send Reset Link
                    </Button>
                </Form>

                <Text ta="center" mt="md">
                    <Link
                        to="/login"
                        style={{ textDecoration: "none", color: "inherit" }}
                    >
                        <Text span c="blue" inherit>
                            Back to login
                        </Text>
                    </Link>
                </Text>
            </Paper>
        </Container>
    );
}
