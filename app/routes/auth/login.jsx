import {
    createCookieSessionStorage,
    redirect,
    Form,
    Link,
} from 'react-router';

import {
    Button,
    Center,
    Container,
    Group,
    Paper,
    PasswordInput,
    Text,
    TextInput,
    Title,
} from '@mantine/core';

import login from '@/utils/auth/login';

import { account } from '@/appwrite';

const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "session",
        secrets: ["your-secret-key"], // TODO: Replace with actual secret from env
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },
});

export async function clientLoader({ request }) {
    console.log('ClientLoader request', { request });
    try {
        const session = await account.getSession('current');
        if (session) {
            // const user = await account.get();
            return redirect("/");
        }
    } catch (error) {
        console.log("No active session found");
    } finally {
        return null;
    }
}

export async function action({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await login({ email, password });

    if (response?.error) {
        return { error: response.error };
    }

    return { email, password, session: response.session };
}

export default function Login({ actionData }) {
    console.log({ actionData });

    return (
        <Container size="xs">
            <Center style={{ minHeight: '100vh' }}>
                <Paper radius="md" p="xl" withBorder style={{ width: '100%' }}>
                    <Title order={3} ta="center" mt="md" mb={50}>
                        Welcome to Rocket Roster!
                    </Title>
                    <Form method="post">
                        <TextInput
                            label="Email address"
                            placeholder="hello@gmail.com"
                            size="md"
                        />
                        <PasswordInput
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
                        <Text component={Link} to="/register" size="sm" c="blue" fw={700}>
                            Register
                        </Text>
                    </Group>
                    {actionData?.error ? (
                        <div>
                            <p>{actionData?.error}</p>
                        </div>
                    ) : null}
                </Paper>
            </Center>
        </Container>
    );
}