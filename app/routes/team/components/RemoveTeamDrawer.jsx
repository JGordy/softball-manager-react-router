import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

import { Button, Stack, Text, TextInput, Alert, Group } from "@mantine/core";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";

// TODO: Add archived team restore flow (admin-initiated via Appwrite console for now)

/**
 * A confirmation drawer for removing a team. The system automatically determines
 * whether to hard-delete (empty/solo teams) or soft-archive (teams with data).
 * The user must type the exact team name before confirming.
 *
 * @param {Object} props
 * @param {boolean} props.opened - Whether the drawer is visible
 * @param {Function} props.onClose - Callback to close the drawer
 * @param {Object} props.team - The team object ({ $id, name })
 */
export default function RemoveTeamDrawer({ opened, onClose, team, players }) {
    const fetcher = useFetcher();
    const [confirmValue, setConfirmValue] = useState("");

    const teamName = team?.name ?? "";
    const teamId = team?.$id;

    const isConfirmed = confirmValue === teamName;
    const isSubmitting = fetcher.state !== "idle";

    const hasData =
        (team?.seasons?.length ?? 0) > 0 || (players?.length ?? 0) > 1;

    // Reset input whenever the drawer opens
    useEffect(() => {
        if (opened) {
            setConfirmValue("");
        }
    }, [opened]);

    const handleSubmit = () => {
        if (!isConfirmed || !teamId) return;

        fetcher.submit(
            { _action: "delete-team" },
            { method: "post", action: `/team/${teamId}` },
        );
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Remove Team"
            position="bottom"
            size="auto"
            padding="xl"
        >
            <Stack gap="lg">
                <Alert
                    icon={<IconAlertTriangle size={18} />}
                    color="red"
                    variant="light"
                    title={
                        hasData
                            ? "This team will be archived"
                            : "This action cannot be undone"
                    }
                >
                    <Text size="sm">
                        {hasData
                            ? "This team has existing data (seasons, games, or players) and will be archived to preserve its history. It will disappear from your dashboard."
                            : "This team is completely empty. It will be permanently deleted and cannot be recovered."}
                    </Text>
                </Alert>

                <Stack gap="xs" my="md">
                    <Text size="sm" fw={500}>
                        Type{" "}
                        <Text span fw={700} c="red">
                            {teamName}
                        </Text>{" "}
                        to confirm:
                    </Text>
                    <TextInput
                        id="remove-team-confirm-input"
                        placeholder={teamName}
                        value={confirmValue}
                        onChange={(e) => setConfirmValue(e.currentTarget.value)}
                        disabled={isSubmitting}
                        size="md"
                        aria-label="Type the team name to confirm removal"
                        error={
                            confirmValue.length > 0 && !isConfirmed
                                ? "Team name does not match"
                                : null
                        }
                    />
                </Stack>

                <Group gap="sm" wrap="nowrap">
                    <Button
                        variant="outline"
                        color="gray"
                        size="md"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        id="remove-team-confirm-button"
                        color="red"
                        size="md"
                        style={{ flex: 1 }}
                        leftSection={<IconTrash size={16} />}
                        disabled={!isConfirmed || isSubmitting}
                        loading={isSubmitting}
                        onClick={handleSubmit}
                    >
                        Remove Team
                    </Button>
                </Group>
            </Stack>
        </DrawerContainer>
    );
}
