// app/routes/login.jsx
import React from "react";
import { Form, Link, useActionData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";

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

import AutocompleteEmail from "@/components/AutocompleteEmail";

import { makeServerAppwrite } from "~/services/appwrite.server";
import { authSession, commitAuthSession } from "~/services/session.server";

// SERVER: runs on POST /login
export async function action({ request }) {
    const form = await request.formData();
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    if (!email || !password) {
        return json(
            { error: "Email and password are required" },
            { status: 400 },
        );
    }

    try {
        const { account } = makeServerAppwrite();

        // 1) Authenticate user against Appwrite (server-side)
        await account.createEmailPasswordSession(email, password);

        // 2) Fetch identity to store minimal claim(s)
        const user = await account.get(); // has $id

        // 3) Mint your HTTP-only Remix session cookie
        const session = await authSession.getSession();
        session.set("userId", user.$id);
        const setCookie = await commitAuthSession(session);

        // 4) Redirect to home (or wherever) with cookie set
        return redirect("/", { headers: { "Set-Cookie": setCookie } });
    } catch (err) {
        const message = err?.message || "Login failed";
        return json({ error: message }, { status: 401 });
    }
}

export default function Login() {
    const actionData = useActionData();

    return (
        <Container size="xs">
            <Center style={{ minHeight: "100vh" }}>
                <Paper radius="md" p="xl" withBorder style={{ width: "100%" }}>
                    <Title order={3} ta="center" mt="md" mb={50}>
                        Welcome to Rocket Roster!
                    </Title>

                    <Form method="post" replace>
                        <AutocompleteEmail />
                        <PasswordInput
                            type="password"
                            name="password"
                            label="Password"
                            placeholder="Your password"
                            mt="md"
                            size="md"
                            required
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
                            <Text c="red.5">{actionData.error}</Text>
                        )}
                    </Center>
                </Paper>
            </Center>
        </Container>
    );
}
