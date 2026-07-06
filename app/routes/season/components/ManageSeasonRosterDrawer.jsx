import { useState, useEffect } from "react";
import { useNavigation } from "react-router";
import {
    Stack,
    Group,
    Text,
    Button,
    Avatar,
    Checkbox,
    ScrollArea,
} from "@mantine/core";
import { IconCheck, IconSquare } from "@tabler/icons-react";
import DrawerContainer from "@/components/DrawerContainer";
import FormWrapper from "@/forms/FormWrapper";
import classes from "@/styles/CheckboxCard.module.css";

/**
 * Drawer component for managing players in a specific season.
 * Allows managers to toggle season participation for team roster members.
 *
 * @param {Object} props
 * @param {boolean} props.opened - Whether the drawer is open
 * @param {Function} props.onClose - Callback when drawer is closed
 * @param {Array} props.teamPlayers - All players currently on the team
 * @param {Array} props.currentPlayers - Players currently on the season roster
 * @param {string} props.teamId - The team ID
 * @param {string} props.seasonId - The season ID
 * @param {string} props.primaryColor - Theme color for buttons and selection
 */
export default function ManageSeasonRosterDrawer({
    opened,
    onClose,
    teamPlayers = [],
    currentPlayers = [],
    teamId,
    seasonId,
    primaryColor = "lime",
}) {
    const navigation = useNavigation();
    const isSubmitting =
        navigation.state === "submitting" &&
        navigation.formData?.get("_action") === "update-season-roster";

    const currentRosterIds = currentPlayers.map((p) => p.$id);
    const [selectedIds, setSelectedIds] = useState(currentRosterIds);

    // Sync selectedIds with currentPlayers when drawer opens
    useEffect(() => {
        if (opened) {
            setSelectedIds(currentPlayers.map((p) => p.$id));
        }
    }, [opened, currentPlayers]);

    const togglePlayer = (id) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const handleSelectAll = () => {
        const allIds = teamPlayers.map((p) => p.$id);
        setSelectedIds(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedIds([]);
    };

    const getPlayerName = (p) =>
        p.name ||
        `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
        "Unknown Player";

    const handleClose = () => {
        onClose();
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={handleClose}
            title="Manage Season Roster"
            size="95%"
        >
            <Stack
                gap="md"
                style={{
                    height: "calc(100vh - 180px)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                    Select players who will be participating in this season.
                    Unselected players won't be visible on the season roster,
                    but will remain on the team.
                </Text>

                <Group gap="xs" style={{ flexShrink: 0 }}>
                    <Button
                        size="xs"
                        variant="default"
                        onClick={handleSelectAll}
                        leftSection={<IconCheck size={14} />}
                    >
                        Select All
                    </Button>
                    <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={handleDeselectAll}
                        leftSection={<IconSquare size={14} />}
                    >
                        Deselect All
                    </Button>
                </Group>

                <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars>
                    <Stack gap={0} pt="xs">
                        {teamPlayers.length > 0 ? (
                            teamPlayers.map((player) => (
                                <Checkbox.Card
                                    key={player.$id}
                                    className={classes.root}
                                    checked={selectedIds.includes(player.$id)}
                                    onClick={() => togglePlayer(player.$id)}
                                >
                                    <Group
                                        wrap="nowrap"
                                        align="center"
                                        gap="sm"
                                    >
                                        <Checkbox.Indicator
                                            color={primaryColor}
                                        />
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
                                            </Text>
                                            <Text size="xs" c="dimmed" truncate>
                                                {player.jerseyNumber
                                                    ? `#${player.jerseyNumber} • `
                                                    : ""}
                                                {player.email || "No email"}
                                            </Text>
                                        </div>
                                    </Group>
                                </Checkbox.Card>
                            ))
                        ) : (
                            <Text c="dimmed" ta="center" py="xl">
                                No team players found.
                            </Text>
                        )}
                    </Stack>
                </ScrollArea>

                <div style={{ flexShrink: 0 }}>
                    <FormWrapper
                        action="update-season-roster"
                        actionRoute={`/season/${seasonId}`}
                        confirmText={`Save Season Roster (${selectedIds.length})`}
                        buttonColor={primaryColor}
                        onCancelClick={handleClose}
                        loading={isSubmitting}
                    >
                        <input
                            type="hidden"
                            name="playerIds"
                            value={JSON.stringify(selectedIds)}
                        />
                        <input type="hidden" name="teamId" value={teamId} />
                    </FormWrapper>
                </div>
            </Stack>
        </DrawerContainer>
    );
}
