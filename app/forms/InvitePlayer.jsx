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

import classes from "@/styles/inputs.module.css";

import FormWrapper from "./FormWrapper";

export default function InvitePlayer({
    actionRoute,
    buttonColor,
    teamId,
    teamName,
}) {
    const [invites, setInvites] = useState([
        { email: "", name: "", key: Date.now() },
    ]);

    const handleAddRow = () => {
        setInvites((current) => [
            ...current,
            { email: "", name: "", key: Date.now() + Math.random() },
        ]);
    };

    const handleRemoveRow = (index) => {
        if (invites.length > 1) {
            setInvites((current) => current.filter((_, i) => i !== index));
        }
    };

    const handleChange = (index, field, value) => {
        const newInvites = [...invites];
        newInvites[index][field] = value;
        setInvites(newInvites);
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

                // Add rows for rest
                for (let i = 1; i < emails.length; i++) {
                    newInvites.push({
                        email: emails[i],
                        name: "",
                        key: Date.now() + Math.random() + i,
                    });
                }
                setInvites(newInvites);
            }
        }
    };

    return (
        <FormWrapper
            action="invite-player"
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText="Send Invitations"
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
                            label={index === 0 ? "Name" : null}
                            name="name"
                            placeholder="John Doe"
                            radius="md"
                            size="md"
                            value={invite.name}
                            required
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
                    color="green"
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddRow}
                    fullWidth
                    mt="xs"
                >
                    Add Another Player
                </Button>

                {/* Hidden field to pass teamId */}
                <input type="hidden" name="teamId" value={teamId} />
            </Stack>
        </FormWrapper>
    );
}
