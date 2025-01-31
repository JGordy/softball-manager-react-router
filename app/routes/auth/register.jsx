import { useEffect } from 'react';

import {
    redirect,
    Form,
    Link,
    // createCookieSessionStorage,
} from 'react-router';

import {
    Button,
    Center,
    Container,
    Group,
    Loader,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';

import { notifications } from '@mantine/notifications';

import AutocompleteEmail from '@/components/AutoCompleteEmail';

import register from '@/utils/auth/register';

import { account } from '@/appwrite';

// import { IconX } from '@tabler/icons-react';

export async function clientLoader({ request }) {
    console.log('loader: ', request)
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
    console.log('action');
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');

    const response = await register({ email, password, name });

    if (response?.error) {
        return { error: response.error };
    }

    return { email, password, session: response.session };
}

export default function Register({ actionData }) {

    useEffect(() => {
        if (actionData?.error) {
            notifications.show({
                title: 'Error',
                message: actionData.error,
                color: 'red',
                position: 'top-right',
            });
        }
    }, [actionData?.error]);

    useEffect(() => {
        console.log('actionData: ', actionData);
        const createUserSession = async () => {
            await account.createEmailPasswordSession(actionData.email, actionData.password);
        };

        if (actionData?.session) {
            notifications.show({
                title: 'Success',
                message: 'Account created successfully',
                color: 'teal',
                position: 'top-right',
            });
            createUserSession();
            redirect('/login');
        }

    }, [actionData]);

    return (
        <Container size="xs">
            <Center style={{ minHeight: '100vh' }}>
                <Paper radius="md" p="xl" withBorder style={{ width: '100%' }}>
                    <Title order={3} ta="center" mt="md" mb={50}>
                        Welcome to Rocket Roster!
                    </Title>
                    <Title order={4} mb="md" ta="center">
                        Create an Account
                    </Title>
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
                        <Text component={Link} to="/login" size="sm" c="blue" fw={700}>
                            Login here
                        </Text>
                    </Group>
                </Paper>
            </Center>
        </Container>
    );
}