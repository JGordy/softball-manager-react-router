import { useEffect } from "react";
import { redirect, Form, Link } from "react-router";
import { ID } from "node-appwrite";

import {
    Button,
    Center,
    Container,
    Group,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";

import branding from "@/constants/branding";

import AutocompleteEmail from "@/components/AutocompleteEmail";

import { hasBadWords } from "@/utils/badWordsApi";

import {
    createAdminClient,
    serializeSessionCookie,
} from "@/utils/appwrite/server";

import { createDocument } from "@/utils/databases";
import { showNotification } from "@/utils/showNotification";

import { redirectIfAuthenticated } from "./utils/redirectIfAuthenticated";

// Check if user is already logged in, redirect to home if so
export async function loader({ request }) {
    return redirectIfAuthenticated(request);
}

export async function action({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    // Input validation
    if (!email || !password || !name) {
        return { error: "Email, password and name are required." };
    }

    try {
        // Check user's name for inappropriate language
        if (await hasBadWords(name)) {
            return {
                error: "Name contains inappropriate language. Please choose a different name.",
            };
        }

        // Create the Appwrite account
        const { account } = createAdminClient();
        const user = await account.create(ID.unique(), email, password, name);

        // Create the user document in the database
        await createDocument(
            "users",
            user.$id, // Use the Appwrite user ID as the document ID
            {
                userId: user.$id, // Store the userId (important!)
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" "),
                email,
            },
        );

        // Create a session for the newly registered user
        const session = await account.createEmailPasswordSession(
            email,
            password,
        );

        // Send verification email
        const origin = new URL(request.url).origin;
        await account.createVerification(`${origin}/verify`);

        // Set the session cookie and redirect to home
        const cookieHeader = serializeSessionCookie(session.secret);

        return redirect("/", {
            headers: {
                "Set-Cookie": cookieHeader,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return { error: error.message || "Failed to create account" };
    }
}

export default function Register({ actionData }) {
    useEffect(() => {
        if (actionData?.error) {
            showNotification({
                variant: "error",
                message: actionData.error,
            });
        }
    }, [actionData]);

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
                        <Stack>
                            <TextInput
                                label="Name"
                                name="name"
                                placeholder="Your name"
                            />
                            <AutocompleteEmail />
                            <PasswordInput
                                name="password"
                                type="password"
                                label="Password"
                                placeholder="Your password"
                            />
                            <Button type="submit" fullWidth>
                                Register
                            </Button>
                        </Stack>
                    </Form>
                    <Group justify="center" mt="md">
                        <Text size="sm">Already have an account?</Text>
                        <Text
                            component={Link}
                            to="/login"
                            size="sm"
                            c="blue"
                            fw={700}
                        >
                            Login here
                        </Text>
                    </Group>
                </Paper>
            </Center>
        </Container>
    );
}
