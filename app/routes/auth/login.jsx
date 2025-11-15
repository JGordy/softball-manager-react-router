import { Form, Link, redirect, useActionData } from "react-router";

import {
    Button,
    Center,
    Container,
    Group,
    Paper,
    PasswordInput,
    Text,
    Title,
} from "@mantine/core";

import {
    createAdminClient,
    serializeSessionCookie,
} from "@/utils/appwrite/server";

import branding from "@/constants/branding";

import AutocompleteEmail from "@/components/AutocompleteEmail";

import { redirectIfAuthenticated } from "./utils/redirectIfAuthenticated";

// Check if user is already logged in, redirect to home if so
export async function loader({ request }) {
    return redirectIfAuthenticated(request);
}

// Server-side action - creates session and sets cookie
export async function action({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        const { account } = createAdminClient();

        // Create email session on Appwrite
        const session = await account.createEmailPasswordSession(
            email,
            password,
        );

        // Serialize the session secret into a cookie
        const cookieHeader = serializeSessionCookie(session.secret);

        // Redirect to home with session cookie
        return redirect("/", {
            headers: {
                "Set-Cookie": cookieHeader,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return {
            error: error.message || "Invalid credentials. Please try again.",
        };
    }
}

export default function Login() {
    const actionData = useActionData();

    return (
        <Container size="xs">
            <Center style={{ minHeight: "100vh" }}>
                <Paper radius="md" p="xl" withBorder style={{ width: "100%" }}>
                    <Title order={1} ta="center" mt="md" mb="xs" c="green">
                        {branding.name}
                    </Title>
                    <Text ta="center" mb={50}>
                        {branding.tagline}
                    </Text>
                    <Form method="post">
                        <AutocompleteEmail />
                        <PasswordInput
                            type="password"
                            name="password"
                            label="Password"
                            placeholder="Your password"
                            mt="md"
                            size="md"
                        />
                        <Button fullWidth mt="xl" size="md" type="submit">
                            Login
                        </Button>
                    </Form>
                    <Group justify="center" mt="md">
                        <Text size="sm">Don't have an account?</Text>
                        <Text
                            component={Link}
                            to="/register"
                            size="sm"
                            c="blue"
                            fw={700}
                        >
                            Register
                        </Text>
                    </Group>
                    <Center>
                        {actionData?.error && (
                            <Text c="red.5">{actionData?.error}</Text>
                        )}
                    </Center>
                </Paper>
            </Center>
        </Container>
    );
}
