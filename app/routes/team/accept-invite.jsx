import { redirect } from "react-router";
import {
    Container,
    Title,
    Text,
    Stack,
    PasswordInput,
    Button,
} from "@mantine/core";
import { Form, useSearchParams } from "react-router";
import {
    acceptTeamInvitation,
    setPasswordForInvitedUser,
} from "@/actions/invitations";
import { useResponseNotification } from "@/utils/showNotification";
import { useEffect, useState } from "react";

/**
 * Handle team invitation acceptance
 * This route is accessed when users click the invitation link in their email
 */
export async function loader() {
    // Just return empty - we'll handle everything in clientAction
    return {};
}

export async function action({ request }) {
    const formData = await request.formData();
    const _action = formData.get("_action");

    if (_action === "set-password") {
        const password = formData.get("password");
        const userId = formData.get("userId");
        const email = formData.get("email");

        const result = await setPasswordForInvitedUser({
            userId,
            email,
            password,
        });

        if (result.success) {
            return redirect("/teams");
        }

        return result;
    }
}

export async function clientAction({ request, params }) {
    const { teamId } = params;
    const formData = await request.formData();
    const _action = formData.get("_action");

    if (_action === "accept-invite") {
        const membershipId = formData.get("membershipId");
        const userId = formData.get("userId");
        const secret = formData.get("secret");

        const result = await acceptTeamInvitation({
            teamId,
            membershipId,
            userId,
            secret,
        });

        if (result.success) {
            return result; // Return the whole result including email and name
        }

        return result;
    }
}

export default function AcceptInvite({ loaderData, actionData, params }) {
    const [searchParams] = useSearchParams();
    const [inviteAccepted, setInviteAccepted] = useState(false);

    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");
    const membershipId = searchParams.get("membershipId");

    useResponseNotification(actionData);

    // Auto-submit the accept invitation form when component mounts
    useEffect(() => {
        if (userId && secret && membershipId && !inviteAccepted) {
            const form = document.getElementById("accept-invite-form");
            if (form) {
                form.requestSubmit();
            }
        }
    }, [userId, secret, membershipId, inviteAccepted]);

    // Redirect to team page if invitation was already confirmed
    useEffect(() => {
        if (actionData?.alreadyConfirmed) {
            window.location.href = `/team/${params.teamId}`;
        }
    }, [actionData, params.teamId]);

    // Update state when invitation is accepted
    useEffect(() => {
        if (actionData?.inviteAccepted) {
            setInviteAccepted(true);
        }
    }, [actionData]);

    // Validation errors
    if (!userId || !secret || !membershipId) {
        return (
            <Container size="sm" py="xl">
                <Stack gap="md" align="center">
                    <Title order={2}>Invitation Error</Title>
                    <Text c="red" ta="center">
                        Invalid invitation link. Please use the link from your
                        email.
                    </Text>
                </Stack>
            </Container>
        );
    }

    // Show password form after invitation is accepted
    // (All new invitations via Teams API need password)
    if (inviteAccepted) {
        return (
            <Container size="sm" py="xl">
                <Stack gap="md">
                    <Title order={2} ta="center">
                        Welcome to the Team!
                    </Title>
                    <Text ta="center">
                        Please set a password to complete your account setup.
                    </Text>

                    <Form method="post">
                        <input
                            type="hidden"
                            name="_action"
                            value="set-password"
                        />
                        <input type="hidden" name="userId" value={userId} />
                        <input
                            type="hidden"
                            name="email"
                            value={actionData?.email}
                        />

                        <PasswordInput
                            name="password"
                            label="Password"
                            placeholder="Create a password"
                            description="Must be at least 8 characters long"
                            withAsterisk
                            required
                            mt="md"
                            radius="md"
                            size="md"
                        />

                        <Button type="submit" fullWidth mt="xl" size="md">
                            Set Password & Continue
                        </Button>
                    </Form>
                </Stack>
            </Container>
        );
    }

    // Show the hidden form that will auto-submit to accept invitation
    return (
        <Container size="sm" py="xl">
            <Stack gap="md" align="center">
                <Title order={2}>Processing Invitation...</Title>
            </Stack>

            {/* Hidden form to accept invitation via clientAction */}
            <Form
                id="accept-invite-form"
                method="post"
                style={{ display: "none" }}
            >
                <input type="hidden" name="_action" value="accept-invite" />
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="secret" value={secret} />
                <input type="hidden" name="membershipId" value={membershipId} />
            </Form>
        </Container>
    );
}
