import { useState } from "react";

import {
    Stack,
    Text,
    TextInput,
    Button,
    Group,
    ActionIcon,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { trackEvent } from "@/utils/analytics";
import { client } from "@/utils/appwrite/client";
import { useSubmit } from "react-router";

import classes from "@/styles/inputs.module.css";

import FormWrapper from "./FormWrapper";

const MAX_INVITES = 20;

export default function InvitePlayer({
    actionRoute,
    buttonColor,
    teamId,
    teamName,
}) {
    const [invites, setInvites] = useState([
        { email: "", name: "", key: crypto.randomUUID() },
    ]);

    const handleAddRow = () => {
        if (invites.length >= MAX_INVITES) {
            return;
        }

        setInvites((current) => [
            ...current,
            { email: "", name: "", key: crypto.randomUUID() },
        ]);
    };

    const handleRemoveRow = (index) => {
        if (invites.length > 1) {
            setInvites((current) => current.filter((_, i) => i !== index));
        }
    };

    const handleChange = (index, field, value) => {
        setInvites((current) => {
            const newInvites = [...current];
            newInvites[index] = {
                ...newInvites[index],
                [field]: value,
            };
            return newInvites;
        });
    };

    const handlePaste = (e, index) => {
        const pastedData = e.clipboardData.getData("text");
        if (pastedData.includes(",") || pastedData.includes("\n")) {
            e.preventDefault();
            const emails = pastedData
                .split(/[\n,]/)
                .map((email) => email.trim())
                .filter((email) => email);

            if (emails.length > 0) {
                const newInvites = [...invites];
                // Update current row with first email
                newInvites[index].email = emails[0];

                // Calculate how many more we can add
                const remainingSlots = MAX_INVITES - newInvites.length;
                const emailsToAdd = emails.slice(1, 1 + remainingSlots);

                // Add rows for rest
                for (let i = 0; i < emailsToAdd.length; i++) {
                    newInvites.push({
                        email: emailsToAdd[i],
                        name: "",
                        key: crypto.randomUUID(),
                    });
                }
                setInvites(newInvites);
            }
        }
    };

    const submit = useSubmit();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const playersToInvite = invites.filter((p) => p.email.trim() !== "");

        if (playersToInvite.length === 0) return;

        setLoading(true);

        trackEvent("invite-player", {
            teamId,
            count: playersToInvite.length,
        });

        const { invitePlayersBrowser } = await import("@/actions/invitations");
        const result = await invitePlayersBrowser({
            teamId,
            players: playersToInvite,
            client,
        });

        if (result.success) {
            submit(
                {
                    _action: "invite-player-sync",
                    players: JSON.stringify(result.results),
                },
                {
                    method: "post",
                    encType: "application/json",
                },
            );
        } else {
            // Even if browser invite fails, submit to action so hook shows error
            submit(
                {
                    _action: "invite-player-sync",
                    error: result.message,
                },
                {
                    method: "post",
                    encType: "application/json",
                },
            );
        }
    };

    return (
        <FormWrapper
            action="invite-player-sync"
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText="Send Invitations"
            onSubmit={handleSubmit}
            loading={loading}
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Add players to {teamName} by email. Paste a comma-separated
                    list to add multiple at once.
                </Text>

                {invites.map((invite, index) => (
                    <Group key={invite.key} align="flex-start" grow>
                        <TextInput
                            className={classes.inputs}
                            label={index === 0 ? "Email Address" : null}
                            name="email"
                            type="email"
                            placeholder="player@example.com"
                            required
                            radius="md"
                            size="md"
                            value={invite.email}
                            onChange={(e) =>
                                handleChange(
                                    index,
                                    "email",
                                    e.currentTarget.value,
                                )
                            }
                            onPaste={(e) => handlePaste(e, index)}
                            style={{ flex: 1 }}
                        />

                        <TextInput
                            className={classes.inputs}
                            label={index === 0 ? "Name (Optional)" : null}
                            name="name"
                            placeholder="John Doe"
                            radius="md"
                            size="md"
                            value={invite.name}
                            onChange={(e) =>
                                handleChange(
                                    index,
                                    "name",
                                    e.currentTarget.value,
                                )
                            }
                            rightSection={
                                invites.length > 1 && (
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() => handleRemoveRow(index)}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                )
                            }
                            style={{ flex: 1 }}
                        />
                    </Group>
                ))}

                <Button
                    variant="subtle"
                    color="lime"
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddRow}
                    fullWidth
                    mt="xs"
                    disabled={invites.length >= MAX_INVITES}
                >
                    Add Another Player
                </Button>

                {/* Hidden field to pass teamId */}
                <input type="hidden" name="teamId" value={teamId} />
            </Stack>
        </FormWrapper>
    );
}
