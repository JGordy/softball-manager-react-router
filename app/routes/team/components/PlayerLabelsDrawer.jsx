import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Avatar, Button, Group, Stack, Text, Divider } from "@mantine/core";
import DrawerContainer from "@/components/DrawerContainer";

export default function PlayerLabelsDrawer({ opened, onClose, team, players }) {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    // Initial labels from team preferences
    const initialLabels = team?.prefs?.playerLabels || {};
    const [labels, setLabels] = useState(initialLabels);

    // Sync state if opened or team prefs change
    useEffect(() => {
        setLabels(initialLabels);
    }, [team?.prefs?.playerLabels, opened]);

    // Close drawer on successful submission
    useEffect(() => {
        if (fetcher.data?.success) {
            onClose();
        }
    }, [fetcher.data, onClose]);

    const toggleLabel = (playerId, label) => {
        setLabels((prev) => {
            const playerLabels = prev[playerId] || [];
            if (playerLabels.includes(label)) {
                return {
                    ...prev,
                    [playerId]: playerLabels.filter((l) => l !== label),
                };
            } else {
                return {
                    ...prev,
                    [playerId]: [...playerLabels, label],
                };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Use JSON payload to avoid FormData array flattening issues
        const jsonData = {
            _action: "update-player-labels",
            labels: labels,
        };

        fetcher.submit(jsonData, {
            method: "post",
            action: `/team/${team.$id}`,
            encType: "application/json",
        });
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Manage Player Labels"
        >
            <fetcher.Form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Assign batting characteristics to your players to
                        fine-tune the generated lineup order.
                    </Text>

                    {players.map((player, index) => (
                        <div key={player.$id}>
                            <Group
                                justify="space-between"
                                wrap="nowrap"
                                mb="sm"
                            >
                                <Group wrap="nowrap">
                                    <Avatar
                                        name={`${player.firstName} ${player.lastName}`}
                                        radius="xl"
                                        size="sm"
                                        color="initials"
                                        variant="light"
                                    />
                                    <Text fw={500} size="sm">
                                        {player.firstName} {player.lastName}
                                    </Text>
                                </Group>
                                <Group gap="xs">
                                    <Button
                                        size="compact-xs"
                                        radius="xl"
                                        variant={
                                            (labels[player.$id] || []).includes(
                                                "Power",
                                            )
                                                ? "light"
                                                : "default"
                                        }
                                        onClick={() =>
                                            toggleLabel(player.$id, "Power")
                                        }
                                    >
                                        Power
                                    </Button>
                                    <Button
                                        size="compact-xs"
                                        radius="xl"
                                        variant={
                                            (labels[player.$id] || []).includes(
                                                "On Base",
                                            )
                                                ? "light"
                                                : "default"
                                        }
                                        onClick={() =>
                                            toggleLabel(player.$id, "On Base")
                                        }
                                    >
                                        On Base
                                    </Button>
                                </Group>
                            </Group>
                            {index < players.length - 1 && <Divider />}
                        </div>
                    ))}

                    <Button
                        type="submit"
                        loading={isSubmitting}
                        fullWidth
                        mt="md"
                    >
                        Save Labels
                    </Button>
                </Stack>
            </fetcher.Form>
        </DrawerContainer>
    );
}
