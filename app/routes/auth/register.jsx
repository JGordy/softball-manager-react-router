import { useEffect } from "react";

import { redirect, Form, Link } from "react-router";

import {
    Button,
    Center,
    Container,
    Group,
    // Loader,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";

import AutocompleteEmail from "@/components/AutocompleteEmail";

import register from "./utils/register";

import { account } from "@/appwrite";

export async function action({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    const response = await register({ email, password, name });

    if (response?.error) {
        return { error: response.error };
    }

    return { email, password, session: response.session };
}

export default function Register({ actionData }) {
    useEffect(() => {
        const createUserSession = async () => {
            await account.createEmailPasswordSession(actionData.email, actionData.password);

            const currentUrl = new URL(window.location.href);
            await account.createVerification(`${currentUrl.origin}/verify`);
            redirect("/");
        };

        if (actionData?.session) {
            createUserSession();
        }
    }, [actionData]);

    return (
        <Container size="xs">
            <Center style={{ minHeight: "100vh" }}>
                <Paper radius="md" p="xl" withBorder style={{ width: "100%" }}>
                    <Title order={3} ta="center" mt="md" mb={50}>
                        Welcome to Rocket Roster!
                    </Title>
                    <Title order={4} mb="md" ta="center">
                        Create an Account
                    </Title>
                    <Form method="post">
                        <Stack>
                            <TextInput label="Name" name="name" placeholder="Your name" />
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
                        <Text component={Link} to="/login" size="sm" c="blue" fw={700}>
                            Login here
                        </Text>
                    </Group>
                    <Center>{actionData?.error && <Text c="red.5">{actionData?.error}</Text>}</Center>
                </Paper>
            </Center>
        </Container>
    );
}
