import { useState } from "react";
import { useFetcher } from "react-router";

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
import useModal from "@/hooks/useModal";
import { showNotification } from "@/utils/showNotification";

import classes from "@/styles/inputs.module.css";

const MAX_INVITES = 20;

export default function InvitePlayer({ buttonColor, teamId, teamName }) {
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

    const { closeAllModals } = useModal();
    const fetcher = useFetcher();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const playersToInvite = invites.filter((p) => p.email.trim() !== "");

        if (playersToInvite.length === 0) return;

        setLoading(true);
        try {
            trackEvent("invite-player", {
                teamId,
                count: playersToInvite.length,
            });

            const { invitePlayersBrowser } = await import(
                "@/actions/invitations"
            );
            const result = await invitePlayersBrowser({
                teamId,
                players: playersToInvite,
                client,
            });

            if (result.success) {
                // Submit via fetcher BEFORE closing modal so the component is
                // still mounted. React Router will revalidate the loader after
                // the action completes, showing the new player without refresh.
                fetcher.submit(
                    { _action: "invite-player-sync", players: result.results },
                    {
                        method: "post",
                        encType: "application/json",
                        action: `/team/${teamId}`,
                    },
                );

                closeAllModals();
                showNotification({
                    variant: "success",
                    message: `Successfully invited ${result.results.length} player(s).`,
                });
            } else {
                showNotification({
                    variant: "error",
                    message: result.message,
                });
            }
        } catch (error) {
            showNotification({
                variant: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to send invitations.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
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
            <Group justify="flex-end" mt="xl" mb="sm">
                <Button
                    type="submit"
                    color={buttonColor || "lime"}
                    autoContrast
                    size="md"
                    disabled={loading}
                    loading={loading}
                >
                    Send Invitations
                </Button>
                <Button
                    variant="outline"
                    color="gray"
                    onClick={closeAllModals}
                    size="md"
                >
                    Cancel
                </Button>
            </Group>
        </form>
    );
}
