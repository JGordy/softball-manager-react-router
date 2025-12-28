import { useEffect } from "react";
import { Form, redirect, useActionData, useNavigation } from "react-router";

import {
    Button,
    Container,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";

import { getAppwriteClient, getCurrentUser } from "@/utils/appwrite/context";

import { showNotification } from "@/utils/showNotification";

/**
 * Onboarding route for new users to complete their profile.
 * Path: /auth/setup
 */
export async function loader({ request, context }) {
    const user = await getCurrentUser(context);
    if (!user) return redirect("/login");

    // If profile is already complete, redirect home
    const isProfileComplete = user.name && user.name !== "User";
    if (isProfileComplete) {
        return redirect("/");
    }

    return { user };
}

export async function action({ request, context }) {
    const formData = await request.formData();
    const name = formData.get("name");

    if (!name) {
        return { error: "Name is required." };
    }

    try {
        const client = getAppwriteClient(context);
        const { account } = client;

        // Update name
        await account.updateName(name);

        return redirect("/");
    } catch (error) {
        console.error("Profile setup error:", error);
        return { error: error.message || "Failed to update profile." };
    }
}

export default function Setup() {
    const actionData = useActionData();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    useEffect(() => {
        if (actionData?.error) {
            showNotification({
                variant: "error",
                message: actionData.error,
            });
        }
    }, [actionData]);

    return (
        <Container size="xs" py="xl">
            <Paper radius="md" p="xl" withBorder>
                <Title order={2} mb="xs">
                    Complete Your Profile
                </Title>
                <Text size="sm" c="dimmed" mb="xl">
                    We just need a few more details to get you ready for game
                    day.
                </Text>

                <Form method="post">
                    <Stack>
                        <TextInput
                            label="Full Name"
                            name="name"
                            placeholder="e.g. John Smith"
                            required
                            disabled={isSubmitting}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            mt="md"
                            loading={isSubmitting}
                        >
                            Save & Continue
                        </Button>
                    </Stack>
                </Form>
            </Paper>
        </Container>
    );
}
