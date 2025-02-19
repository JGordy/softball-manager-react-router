import React, { useEffect } from 'react';

import {
    Form,
    Link,
    useNavigate,
} from 'react-router';

import {
    Button,
    Center,
    Container,
    Group,
    Paper,
    PasswordInput,
    Text,
    Title,
} from '@mantine/core';

import { account } from '@/appwrite';

import { useAuth } from '@/contexts/auth/useAuth';

import AutocompleteEmail from '@/components/AutoCompleteEmail';

import login from './utils/login';

export async function clientAction({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await login({ email, password });

    if (response?.error) {
        return { error: response.error?.message || response.error };
    }

    return { email, password, session: response.session };
}

export default function Login({ actionData }) {

    const { setUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkCurrentSession = async () => {
            try {
                const session = await account.getSession('current');
                if (session) {
                    setUser();
                    navigate(`/user/${session.userId}`);
                }
                return null;
            } catch (error) {
                console.log("No active session found");
                return null;
            }
        };
        checkCurrentSession();
    }, []);

    return (
        <Container size="xs">
            <Center style={{ minHeight: '100vh' }}>
                <Paper radius="md" p="xl" withBorder style={{ width: '100%' }}>
                    <Title order={3} ta="center" mt="md" mb={50}>
                        Welcome to Rocket Roster!
                    </Title>
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
                        <Text component={Link} to="/register" size="sm" c="blue" fw={700}>
                            Register
                        </Text>
                    </Group>
                    <Center>
                        {actionData?.error && <Text c="red.5">{actionData?.error}</Text>}
                    </Center>
                </Paper>
            </Center>
        </Container>
    );
}