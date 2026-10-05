import { useState } from "react";
import { useFetcher } from "react-router";
import {
    Alert,
    Button,
    Group,
    Radio,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { client } from "@/utils/appwrite/client";
import useModal from "@/hooks/useModal";
import { showNotification } from "@/utils/showNotification";

/**
 * Modal form for converting a temporary guest player into a full team member.
 * Sends an email invitation via the client Appwrite SDK, then triggers server-side
 * stat and lineup re-attribution.
 *
 * @param {object} props
 * @param {object} props.guestPlayer - The guest player object to convert.
 * @param {string} props.teamId - ID of the team.
 * @param {string} [props.actionRoute] - The route to post the conversion form to.
 * @param {string} [props.buttonColor] - Custom button theme color.
 */
export default function ConvertGuestModal({
    guestPlayer,
    teamId,
    actionRoute,
    buttonColor = "lime",
}) {
    const { closeAllModals } = useModal();
    const fetcher = useFetcher();
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState(guestPlayer?.firstName || "");
    const [lastName, setLastName] = useState(guestPlayer?.lastName || "");
    const [gender, setGender] = useState(guestPlayer?.gender || "Male");

    if (!guestPlayer) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) return;

        setLoading(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
            const { invitePlayersBrowser } = await import(
                "@/actions/invitations"
            );
            const result = await invitePlayersBrowser({
                teamId,
                players: [{ email: trimmedEmail, name: fullName }],
                client,
            });

            if (result.success) {
                const newUserId = result.results?.[0]?.userId;
                fetcher.submit(
                    {
                        _action: "convert-guest-player",
                        guestPlayerId: guestPlayer.$id,
                        teamId,
                        email: trimmedEmail,
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        gender,
                        ...(newUserId ? { newUserId } : {}),
                    },
                    {
                        method: "post",
                        action: actionRoute || `/team/${teamId}`,
                    },
                );

                closeAllModals();
                showNotification({
                    variant: "success",
                    message: `Invitation sent to ${trimmedEmail}! Past stats are being attributed.`,
                });
            } else {
                showNotification({
                    variant: "error",
                    message: result.message || "Failed to send invitation.",
                });
            }
        } catch (error) {
            showNotification({
                variant: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to send invitation.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="md">
                <Alert
                    variant="light"
                    color="blue"
                    icon={<IconInfoCircle size={18} />}
                    title="Stat Attribution"
                >
                    <Text size="sm">
                        Sending an invitation will invite this player to join
                        the team. All past game logs, box scores, and statistics
                        from their guest appearances will be automatically
                        attributed to their account.
                    </Text>
                </Alert>

                <TextInput
                    label="Email Address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    placeholder="player@example.com"
                    required
                    radius="md"
                    size="md"
                    autoFocus
                />

                <Group grow>
                    <TextInput
                        label="First Name"
                        name="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.currentTarget.value)}
                        required
                        radius="md"
                        size="md"
                    />
                    <TextInput
                        label="Last Name"
                        name="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.currentTarget.value)}
                        required
                        radius="md"
                        size="md"
                    />
                </Group>

                <Radio.Group
                    label="Gender"
                    name="gender"
                    value={gender}
                    onChange={setGender}
                    required
                    size="md"
                >
                    <Group mt="xs">
                        <Radio value="Male" label="Male" />
                        <Radio value="Female" label="Female" />
                    </Group>
                </Radio.Group>

                <Group justify="flex-end" mt="xl" mb="sm">
                    <Button
                        type="submit"
                        color={buttonColor}
                        autoContrast
                        size="md"
                        disabled={loading}
                        loading={loading}
                    >
                        Send Invite
                    </Button>
                    <Button
                        variant="outline"
                        color="gray"
                        onClick={closeAllModals}
                        size="md"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
