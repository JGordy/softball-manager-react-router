import { useEffect } from "react";
import { data, Form, Link, useNavigate, useNavigation } from "react-router";
import { ID } from "node-appwrite";

import {
    Button,
    Center,
    Container,
    Group,
    Image,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    useComputedColorScheme,
    Divider,
} from "@mantine/core";
import branding from "@/constants/branding";
import images from "@/constants/images";

import AutocompleteEmail from "@/components/AutocompleteEmail";
import GoogleButton from "@/components/GoogleButton";

import { hasBadWords } from "@/utils/badWordsApi";

import {
    createAdminClient,
    createSessionClientFromSecret,
    serializeSessionCookie,
} from "@/utils/appwrite/server";

import { createDocument } from "@/utils/databases";
import { showNotification } from "@/utils/showNotification";
import { trackEvent, identifyUser } from "@/utils/analytics";

import { redirectIfAuthenticated } from "./utils/redirectIfAuthenticated";

const { brandLogoDark, brandLogoLight } = images;

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
        try {
            const { account: sessionAccount } = createSessionClientFromSecret(
                session.secret,
            );
            const origin = new URL(request.url).origin;
            await sessionAccount.createVerification(`${origin}/verify`);
        } catch (verificationError) {
            // Log the error but don't fail the registration
            console.error(
                "Verification email failed to send:",
                verificationError,
            );
        }

        // Set the session cookie and redirect to home
        const cookieHeader = serializeSessionCookie(session.secret);

        return data(
            { success: true, userId: user.$id },
            {
                headers: {
                    "Set-Cookie": cookieHeader,
                },
            },
        );
    } catch (error) {
        console.error("Registration error:", error);
        return { error: error.message || "Failed to create account" };
    }
}

export default function Register({ actionData }) {
    const computedColorScheme = useComputedColorScheme("light");
    const brandLogo =
        computedColorScheme === "light" ? brandLogoLight : brandLogoDark;
    const navigate = useNavigate();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === "submitting";

    useEffect(() => {
        if (actionData?.error) {
            showNotification({
                variant: "error",
                message: actionData.error,
            });
        }
        if (actionData?.success) {
            identifyUser(actionData.userId);
            trackEvent("registration-success");
            navigate("/", { replace: true });
        }
    }, [actionData, navigate]);

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

                    <Group grow mb="md" mt="md">
                        <GoogleButton
                            component={Link}
                            to="/auth/oauth?provider=google"
                        />
                    </Group>

                    <Divider
                        label="Or register with email"
                        labelPosition="center"
                        my="lg"
                    />

                    <Form method="post">
                        <Stack>
                            <TextInput
                                label="Name"
                                name="name"
                                placeholder="Your name"
                                disabled={isSubmitting}
                            />
                            <AutocompleteEmail disabled={isSubmitting} />
                            <PasswordInput
                                name="password"
                                type="password"
                                label="Password"
                                placeholder="Your password"
                                disabled={isSubmitting}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                loading={isSubmitting}
                            >
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
