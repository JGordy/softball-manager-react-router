import { Stack, Text, TextInput } from "@mantine/core";

import classes from "@/styles/inputs.module.css";

import FormWrapper from "./FormWrapper";

export default function InvitePlayer({
    actionRoute,
    buttonColor,
    teamId,
    teamName,
}) {
    return (
        <FormWrapper
            action="invite-player"
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText="Send Invitation"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Add a player to {teamName} by email address. If they already
                    have an account, they'll be added immediately. If they're
                    new, they'll receive an email to create their account and
                    will automatically join your team.
                </Text>

                <TextInput
                    className={classes.inputs}
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="player@example.com"
                    required
                    radius="md"
                    size="md"
                    description="Works for both existing and new users"
                />

                <TextInput
                    className={classes.inputs}
                    label="Player Name (Optional)"
                    name="name"
                    placeholder="John Doe"
                    radius="md"
                    size="md"
                    description="Used for account creation if the user is new"
                />

                {/* Hidden field to pass teamId */}
                <input type="hidden" name="teamId" value={teamId} />
            </Stack>
        </FormWrapper>
    );
}
