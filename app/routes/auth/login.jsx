import React, { useEffect } from 'react';

import {
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
    Title,
} from '@mantine/core';

// import { notifications } from '@mantine/notifications';

// const IconX = React.lazy(() => import('@tabler/icons-react').then(mod => ({
//     default: mod.IconX
// })));

import { account } from '@/appwrite';

import AutocompleteEmail from '@/components/AutoCompleteEmail';

import login from './utils/login';

export async function clientLoader({ request }) {
    try {
        const session = await account.getSession('current');

        if (session) {
            return redirect(`/user/${session.userId}`);
        }
        return null;
    } catch (error) {
        console.log("No active session found");
        return null;
    }
}

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

    useEffect(() => {
        if (actionData?.session) {
            redirect('/');
        }

    }, [actionData]);

    useEffect(() => {
        const checkCurrentSession = async () => {
            try {
                const session = await account.getSession('current');
                if (session) {
                    return redirect("/");
                }
                return null;
            } catch (error) {
                console.log("No active session found");
                return null;
            }
        };
        checkCurrentSession();
    }, []);

    // useEffect(() => {
    //     if (actionData?.error) {
    //         notifications.show({
    //             title: 'Error',
    //             message: actionData.error,
    //             color: 'red',
    //             position: 'top-right',
    //             icon: <IconX />,
    //             autoClose: 1000000,
    //         });
    //     }
    // }, [actionData?.error]);

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