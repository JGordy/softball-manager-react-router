import { useNavigate } from "react-router";
import { useNotifications } from "@/hooks/useNotifications";
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
        const name = formData.get("name");

        const result = await setPasswordForInvitedUser({
            userId,
            email,
            password,
            name,
        });

        // setPasswordForInvitedUser returns a Response on success (with redirect and cookie)
        if (result instanceof Response) {
            return result;
        }

        return result;
    }

    return { success: false, message: "Unknown action" };
}

export async function clientAction({ request, params, serverAction }) {
    const { teamId } = params;

    // Clone the request so we can read formData without consuming the original
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();
    const _action = formData.get("_action");

    // Only handle accept-invite on client, pass everything else to server
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

        return result;
    }

    // For all other actions (like set-password), pass through to server action
    return serverAction();
}

export default function AcceptInvite({ loaderData, actionData, params }) {
    const [searchParams] = useSearchParams();
    const [inviteAccepted, setInviteAccepted] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();

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
            navigate(`/team/${params.teamId}`);
        }
    }, [actionData, params.teamId, navigate]);

    // Auto-subscribe to team notifications if global notifications are enabled
    const { pushTargetId, subscribeToTeam } = useNotifications();
    useEffect(() => {
        if (
            (inviteAccepted || actionData?.alreadyConfirmed) &&
            pushTargetId &&
            params.teamId
        ) {
            subscribeToTeam(params.teamId).catch((err) =>
                console.error("Auto-subscribe failed:", err),
            );
        }
    }, [
        inviteAccepted,
        actionData?.alreadyConfirmed,
        pushTargetId,
        params.teamId,
        subscribeToTeam,
    ]);

    // Update state when invitation is accepted
    useEffect(() => {
        if (actionData?.inviteAccepted) {
            setInviteAccepted(true);
            if (actionData.email) {
                setUserEmail(actionData.email);
            }
            if (actionData.name) {
                setUserName(actionData.name);
            }
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
                        <input type="hidden" name="email" value={userEmail} />
                        <input type="hidden" name="name" value={userName} />

                        <PasswordInput
                            name="password"
                            label="Password"
                            placeholder="Create a password"
                            description="Must be at least 8 characters long"
                            withAsterisk
                            required
                            minLength={8}
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
