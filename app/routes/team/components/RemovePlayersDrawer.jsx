import { useState } from "react";
import {
    Stack,
    Group,
    Text,
    Button,
    Avatar,
    Checkbox,
    ScrollArea,
    Alert,
} from "@mantine/core";
import {
    IconAlertCircle,
    IconUserMinus,
    IconArrowLeft,
} from "@tabler/icons-react";
import DrawerContainer from "@/components/DrawerContainer";
import FormWrapper from "@/forms/FormWrapper";
import classes from "@/styles/CheckboxCard.module.css";

/**
 * Drawer component for batch removing players from a team.
 * Uses Mantine Checkbox Cards for a rich selection experience.
 *
 * @param {Object} props
 * @param {boolean} props.opened - Whether the drawer is open
 * @param {Function} props.onClose - Callback when drawer is closed
 * @param {Array} props.players - List of players on the team
 * @param {string} props.teamId - The team ID
 * @param {string} props.userId - The current user's ID
 */
export default function RemovePlayersDrawer({
    opened,
    onClose,
    players,
    teamId,
    userId,
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [confirming, setConfirming] = useState(false);

    // Only allow removal of players who have a membership record
    const eligiblePlayers = players.filter((p) => p.membershipId);

    const togglePlayer = (id) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const selectedPlayers = players.filter((p) =>
        selectedIds.includes(p.membershipId),
    );

    const handleConfirm = () => setConfirming(true);
    const handleCancel = () => setConfirming(false);

    const getPlayerName = (p) =>
        p.name ||
        `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
        "Unknown Player";

    const resetState = () => {
        setConfirming(false);
        setSelectedIds([]);
    };

    const handleClose = () => {
        onClose();
        // Delay resetting state to avoid flash while drawer is closing
        setTimeout(resetState, 300);
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={handleClose}
            title={confirming ? "Confirm Removal" : "Remove Players"}
            size="95%"
        >
            {!confirming ? (
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Select one or more players to remove from the team.
                        Their historical stats, awards, and logs will remain in
                        the system.
                    </Text>

                    <ScrollArea h="calc(100vh - 350px)" offsetScrollbars>
                        <Stack gap={0} pt="xs">
                            {eligiblePlayers.length > 0 ? (
                                eligiblePlayers.map((player) => (
                                    <Checkbox.Card
                                        key={player.membershipId}
                                        className={classes.root}
                                        checked={selectedIds.includes(
                                            player.membershipId,
                                        )}
                                        onClick={() =>
                                            togglePlayer(player.membershipId)
                                        }
                                    >
                                        <Group
                                            wrap="nowrap"
                                            align="center"
                                            gap="sm"
                                        >
                                            <Checkbox.Indicator color="red" />
                                            <Avatar
                                                src={player.avatarUrl}
                                                name={getPlayerName(player)}
                                                radius="xl"
                                                size="sm"
                                                color="initials"
                                            />
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={500}>
                                                    {getPlayerName(player)}
                                                    {player.$id === userId &&
                                                        " (You)"}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    truncate
                                                >
                                                    {player.email || "No email"}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Checkbox.Card>
                                ))
                            ) : (
                                <Text c="dimmed" ta="center" py="xl">
                                    No players found to remove.
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea>

                    <Button
                        leftSection={<IconUserMinus size={18} />}
                        color="red"
                        size="md"
                        disabled={selectedIds.length === 0}
                        onClick={handleConfirm}
                        fullWidth
                    >
                        Remove {selectedIds.length} Selected Player(s)
                    </Button>
                </Stack>
            ) : (
                <Stack gap="lg">
                    <Alert
                        icon={<IconAlertCircle size={18} />}
                        title="Final Confirmation"
                        color="red"
                        variant="light"
                    >
                        Are you sure you want to remove these{" "}
                        {selectedIds.length} player(s)? This action will revoke
                        their access to this team immediately.
                    </Alert>

                    <Text size="sm" fw={500}>
                        Players to be removed:
                    </Text>
                    <ScrollArea h={200} offsetScrollbars>
                        <Stack gap="xs" pr="xs">
                            {selectedPlayers.map((player) => (
                                <Group key={player.membershipId} gap="sm">
                                    <Avatar
                                        src={player.avatarUrl}
                                        name={getPlayerName(player)}
                                        radius="xl"
                                        size="xs"
                                        color="initials"
                                    />
                                    <Text size="sm">
                                        {getPlayerName(player)}
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </ScrollArea>

                    <FormWrapper
                        action="remove-players"
                        actionRoute={`/team/${teamId}`}
                        confirmText="Confirm Removal"
                        buttonColor="red"
                        onSuccess={handleClose}
                    >
                        <input
                            type="hidden"
                            name="membershipIds"
                            value={JSON.stringify(selectedIds)}
                        />
                    </FormWrapper>

                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconArrowLeft size={18} />}
                        onClick={handleCancel}
                    >
                        Back to Selection
                    </Button>
                </Stack>
            )}
        </DrawerContainer>
    );
}
