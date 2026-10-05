import { Alert, Group, Radio, Stack, Text, TextInput } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import FormWrapper from "@/forms/FormWrapper";

/**
 * Modal form for converting a temporary guest player into a full team member.
 * Captures email address, validates names and gender, and submits the conversion action.
 *
 * @param {object} props
 * @param {object} props.guestPlayer - The guest player object to convert.
 * @param {string} props.teamId - ID of the team.
 * @param {string} props.actionRoute - The route to post the conversion form to.
 * @param {string} [props.buttonColor] - Custom button theme color.
 */
export default function ConvertGuestModal({
    guestPlayer,
    teamId,
    actionRoute,
    buttonColor = "lime",
}) {
    if (!guestPlayer) return null;

    return (
        <FormWrapper
            action="convert-guest-player"
            actionRoute={actionRoute}
            confirmText="Send Invite"
            buttonColor={buttonColor}
        >
            <input type="hidden" name="guestPlayerId" value={guestPlayer.$id} />
            <input type="hidden" name="teamId" value={teamId} />

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
                        defaultValue={guestPlayer.firstName || ""}
                        required
                        radius="md"
                        size="md"
                    />
                    <TextInput
                        label="Last Name"
                        name="lastName"
                        defaultValue={guestPlayer.lastName || ""}
                        required
                        radius="md"
                        size="md"
                    />
                </Group>

                <Radio.Group
                    label="Gender"
                    name="gender"
                    defaultValue={guestPlayer.gender || "Male"}
                    required
                    size="md"
                >
                    <Group mt="xs">
                        <Radio value="Male" label="Male" />
                        <Radio value="Female" label="Female" />
                    </Group>
                </Radio.Group>
            </Stack>
        </FormWrapper>
    );
}
