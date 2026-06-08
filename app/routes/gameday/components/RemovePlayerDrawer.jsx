import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import {
    Stack,
    Text,
    Button,
    Group,
    Avatar,
    Paper,
    Radio,
    Alert,
    Box,
} from "@mantine/core";
import { IconUserMinus, IconAlertTriangle } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer/DrawerContainer";
import { getActivePlayerInSlot } from "../utils/gamedayUtils";

/**
 * RemovePlayerDrawer component renders a drawer allowing user to remove a player mid-game.
 * It uses a two-step flow: first selecting the player, then choosing the removal option (skip or auto-out).
 *
 * @param {object} props
 * @param {boolean} props.opened - State indicating if the drawer is visible
 * @param {function} props.onClose - Callback function to close the drawer
 * @param {Array} props.playerChart - List of players in the current lineup/chart
 * @param {function} props.onConfirmRemove - Callback invoked when removal is confirmed
 */
export default function RemovePlayerDrawer({
    opened,
    onClose,
    playerChart = [],
    onConfirmRemove,
}) {
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
    const [removalType, setRemovalType] = useState("skip");
    const { isDesktop } = useOutletContext();

    // Reset selection when drawer closes or opens
    useEffect(() => {
        if (!opened) {
            setSelectedSlotIndex(null);
            setRemovalType("skip");
        }
    }, [opened]);

    // Filter to slots that haven't been removed yet
    const activeSlots = playerChart
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => !slot.removed);

    const handleConfirm = () => {
        if (selectedSlotIndex !== null) {
            onConfirmRemove(selectedSlotIndex, removalType);
            onClose();
        }
    };

    const selectedSlot =
        selectedSlotIndex !== null ? playerChart[selectedSlotIndex] : null;
    const selectedPlayer = selectedSlot
        ? getActivePlayerInSlot(selectedSlot)
        : null;
    const selectedName = selectedPlayer
        ? `${selectedPlayer.firstName || ""}${selectedPlayer.lastName ? " " + selectedPlayer.lastName : ""}`.trim()
        : "";

    return (
        <DrawerContainer
            size={isDesktop ? "md" : "xl"}
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconUserMinus size={18} />
                    <Text fw={700}>
                        {selectedSlotIndex === null
                            ? "Remove Player mid-game"
                            : "Configure Player Removal"}
                    </Text>
                </Group>
            }
        >
            <Stack gap="md">
                {selectedSlotIndex === null ? (
                    // Step 1: Select Player
                    <>
                        <Alert
                            icon={<IconAlertTriangle size={16} />}
                            title="Warning"
                            color="orange"
                            variant="light"
                        >
                            Removing a player from the lineup is permanent for
                            the remainder of the game. Previous stats/at-bats
                            will remain intact.
                        </Alert>

                        <Text size="sm" fw={600} mb={-5}>
                            Select Player to Remove:
                        </Text>

                        {activeSlots.length === 0 ? (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                                No active players in the lineup.
                            </Text>
                        ) : (
                            <Box
                                style={{
                                    maxHeight: "50vh",
                                    overflowY: "auto",
                                    paddingRight: "4px",
                                }}
                            >
                                <Stack gap="xs">
                                    {activeSlots.map(({ slot, index }) => {
                                        const activePlayer =
                                            getActivePlayerInSlot(slot);
                                        const activeName =
                                            `${activePlayer.firstName || ""}${activePlayer.lastName ? " " + activePlayer.lastName : ""}`.trim();

                                        return (
                                            <Button
                                                key={slot.$id || index}
                                                variant="subtle"
                                                color="gray"
                                                onClick={() =>
                                                    setSelectedSlotIndex(index)
                                                }
                                                fullWidth
                                                justify="flex-start"
                                                h="auto"
                                                p="xs"
                                                style={{ flexShrink: 0 }}
                                                leftSection={
                                                    <Avatar
                                                        size="sm"
                                                        color="blue"
                                                        radius="xl"
                                                    >
                                                        {
                                                            activePlayer
                                                                .firstName?.[0]
                                                        }
                                                        {
                                                            activePlayer
                                                                .lastName?.[0]
                                                        }
                                                    </Avatar>
                                                }
                                            >
                                                <Stack
                                                    gap={2}
                                                    align="flex-start"
                                                >
                                                    <Text size="sm" fw={500}>
                                                        {index + 1}.{" "}
                                                        {activeName}
                                                    </Text>
                                                </Stack>
                                            </Button>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}

                        <Group grow mt="md">
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </Group>
                    </>
                ) : (
                    // Step 2: Select Removal Option
                    <>
                        <Paper p="sm" radius="md" withBorder>
                            <Group gap="sm">
                                <Avatar size="sm" color="blue" radius="xl">
                                    {selectedPlayer?.firstName?.[0]}
                                    {selectedPlayer?.lastName?.[0]}
                                </Avatar>
                                <Stack gap={2}>
                                    <Text size="xs" c="dimmed">
                                        Selected Player
                                    </Text>
                                    <Text fw={700} size="sm">
                                        {selectedSlotIndex + 1}. {selectedName}
                                    </Text>
                                </Stack>
                            </Group>
                        </Paper>

                        <Stack gap="sm">
                            <Text size="sm" fw={600}>
                                Select League Rule / Option:
                            </Text>
                            <Radio.Group
                                value={removalType}
                                onChange={setRemovalType}
                            >
                                <Stack gap="sm">
                                    <Paper p="sm" radius="md" withBorder>
                                        <Group align="flex-start" wrap="nowrap">
                                            <Radio value="skip" mt={3} />
                                            <Stack gap={2}>
                                                <Text size="sm" fw={600}>
                                                    Skip future at-bats (No
                                                    Penalty)
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    The player is bypassed in
                                                    the batting order. No out is
                                                    recorded when their turn
                                                    comes up. Ideal for when a
                                                    team can bat a shorter
                                                    lineup without penalty.
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>

                                    <Paper p="sm" radius="md" withBorder>
                                        <Group align="flex-start" wrap="nowrap">
                                            <Radio value="auto-out" mt={3} />
                                            <Stack gap={2}>
                                                <Text size="sm" fw={600}>
                                                    Automatic Out (Penalty)
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    When the player's turn to
                                                    bat comes up, an automatic
                                                    out is recorded. The player
                                                    receives no plate appearance
                                                    or at-bat in their stats.
                                                    Ideal for leagues that
                                                    penalize teams for playing
                                                    with fewer than a minimum
                                                    number of players.
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                </Stack>
                            </Radio.Group>
                        </Stack>

                        <Group grow mt="md">
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={() => setSelectedSlotIndex(null)}
                            >
                                Back
                            </Button>
                            <Button color="red" onClick={handleConfirm}>
                                Confirm Removal
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        </DrawerContainer>
    );
}
