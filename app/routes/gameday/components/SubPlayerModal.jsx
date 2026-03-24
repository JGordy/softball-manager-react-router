import { useState, useEffect } from "react";
import { useMediaQuery } from "@mantine/hooks";

import {
    Stack,
    Text,
    Button,
    Group,
    Avatar,
    UnstyledButton,
    Badge,
} from "@mantine/core";

import { IconArrowsExchange } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer/DrawerContainer";

import { getActivePlayerInSlot } from "../utils/gamedayUtils";

export default function SubPlayerModal({
    opened,
    onClose,
    currentSlot,
    eligibleSubstitutes = [],
    onConfirmSub,
}) {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const isDesktop = useMediaQuery("(min-width: 62em)");

    // Reset selection when modal closes or opens
    useEffect(() => {
        if (!opened) {
            setSelectedPlayer(null);
        }
    }, [opened]);

    if (!currentSlot) return null;

    const activePlayer = getActivePlayerInSlot(currentSlot);
    const activeName = `${activePlayer.firstName} ${activePlayer.lastName}`;
    const isCurrentSub = !!currentSlot.substitutions?.length;

    const handleConfirm = () => {
        if (selectedPlayer) {
            onConfirmSub(selectedPlayer);
            onClose();
        }
    };

    return (
        <DrawerContainer
            size={isDesktop ? "md" : "xl"}
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconArrowsExchange size={18} />
                    <Text fw={700}>Sub Current Batter</Text>
                </Group>
            }
        >
            <Stack gap="md">
                <Group gap="xs">
                    <Text size="sm" c="dimmed">
                        Replacing:
                    </Text>
                    <Text size="sm" fw={600}>
                        {activeName}
                    </Text>
                    {isCurrentSub && (
                        <Badge size="xs" color="orange" variant="light">
                            SUB
                        </Badge>
                    )}
                </Group>

                {eligibleSubstitutes.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="md">
                        No eligible substitutes available.
                    </Text>
                ) : (
                    <Stack
                        gap="xs"
                        style={{ maxHeight: "60vh", overflowY: "auto" }}
                    >
                        {eligibleSubstitutes.map((player) => {
                            const isSelected =
                                selectedPlayer?.$id === player.$id;

                            return (
                                <UnstyledButton
                                    key={player.$id}
                                    onClick={() => setSelectedPlayer(player)}
                                    style={{ width: "100%" }}
                                >
                                    <Group
                                        p="xs"
                                        style={(theme) => ({
                                            borderRadius: theme.radius.md,
                                            border: `1px solid ${isSelected ? "var(--mantine-color-blue-filled)" : "var(--mantine-color-default-border)"}`,
                                            backgroundColor: isSelected
                                                ? "var(--mantine-color-blue-light)"
                                                : "transparent",
                                            transition: "all 0.15s ease",
                                            "&:hover": {
                                                backgroundColor: isSelected
                                                    ? "var(--mantine-color-blue-light-hover)"
                                                    : "var(--mantine-color-default-hover)",
                                            },
                                        })}
                                    >
                                        <Avatar
                                            size="sm"
                                            color="blue"
                                            radius="xl"
                                        >
                                            {player.firstName?.[0]}
                                            {player.lastName?.[0]}
                                        </Avatar>
                                        <Text
                                            size="sm"
                                            fw={isSelected ? 600 : 500}
                                            c={isSelected ? "blue" : undefined}
                                        >
                                            {player.firstName} {player.lastName}
                                        </Text>
                                    </Group>
                                </UnstyledButton>
                            );
                        })}
                    </Stack>
                )}

                <Group grow>
                    <Button variant="subtle" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    {eligibleSubstitutes.length > 0 && (
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedPlayer}
                        >
                            Confirm Sub
                        </Button>
                    )}
                </Group>
            </Stack>
        </DrawerContainer>
    );
}
