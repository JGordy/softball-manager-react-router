import { Form, Link, redirect, useActionData } from "react-router";

import {
    Button,
    Center,
    Container,
    Group,
    Image,
    Paper,
    PasswordInput,
    Text,
    useComputedColorScheme,
    Divider,
} from "@mantine/core";
import GoogleButton from "@/components/GoogleButton";

import {
    createAdminClient,
    serializeSessionCookie,
} from "@/utils/appwrite/server";

import branding from "@/constants/branding";
import images from "@/constants/images";

import AutocompleteEmail from "@/components/AutocompleteEmail";

import { redirectIfAuthenticated } from "./utils/redirectIfAuthenticated";
import { useEffect } from "react";
import { showNotification } from "@/utils/showNotification";

const { brandLogoDark, brandLogoLight } = images;

// Check if user is already logged in, redirect to home if so
export async function loader({ request }) {
    const response = await redirectIfAuthenticated(request);
    if (response) return response;

    const url = new URL(request.url);
    const urlError = url.searchParams.get("error");
    return { urlError };
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

export default function Login({ loaderData }) {
    const actionData = useActionData();
    const computedColorScheme = useComputedColorScheme("light");
    const brandLogo =
        computedColorScheme === "light" ? brandLogoLight : brandLogoDark;

    const displayError = actionData?.error || loaderData?.urlError;

    useEffect(() => {
        if (actionData?.error) {
            showNotification({
                variant: "error",
                message: actionData.error,
            });
        }
        if (actionData?.success) {
            // Handle success notification if needed
        }
    }, [actionData]);

    return (
        <Container size="xs">
            <Center style={{ minHeight: "100vh" }}>
                <Paper radius="md" p="xl" withBorder style={{ width: "100%" }}>
                    <Image
                        src={brandLogo}
                        alt={branding.name}
                        px="xl"
                        my="xl"
                    />

                    <GoogleButton
                        component={Link}
                        to="/auth/oauth?provider=google"
                    />

                    <Divider
                        label="Or continue with email"
                        labelPosition="center"
                        my="lg"
                    />

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
                    <Center mt="md">
                        {displayError && (
                            <Text c="red.5" size="sm">
                                {displayError}
                            </Text>
                        )}
                    </Center>
                </Paper>
            </Center>
        </Container>
    );
}
