import { useMemo } from "react";
import { useFetcher } from "react-router";
import { Avatar, Group, Select, Stack, Text } from "@mantine/core";
import DrawerContainer from "@/components/DrawerContainer";

const getRoleWeight = (roles) => {
    if (roles.includes("owner")) return 3;
    if (roles.includes("manager")) return 2;
    return 1;
};

export default function ManageRolesDrawer({
    opened,
    onClose,
    players,
    teamId,
    userId,
}) {
    const fetcher = useFetcher();

    const roleOptions = [
        { value: "player", label: "Player" },
        { value: "manager", label: "Manager" },
        { value: "owner", label: "Owner" },
    ];

    const handleRoleChange = (playerId, newRole) => {
        const formData = new FormData();
        formData.append("_action", "update-role");
        formData.append("playerId", playerId);
        formData.append("role", newRole);

        fetcher.submit(formData, {
            method: "post",
            action: `/team/${teamId}`,
        });
    };

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => {
            return getRoleWeight(b.roles) - getRoleWeight(a.roles);
        });
    }, [players]);

    // Count total owners to prevent last owner from demoting themselves
    const ownerCount = useMemo(() => {
        return players.filter((p) => p.roles.includes("owner")).length;
    }, [players]);

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Manage Member Roles"
            size="xl"
        >
            <Stack gap="lg">
                {sortedPlayers.map((player) => {
                    // Determine current role (highest privilege)
                    let currentRole = "player";
                    if (player.roles.includes("owner")) currentRole = "owner";
                    else if (player.roles.includes("manager"))
                        currentRole = "manager";

                    const isCurrentUser = player.$id === userId;
                    const isOwner = currentRole === "owner";
                    const isLastOwner = isOwner && ownerCount === 1;

                    return (
                        <Group
                            key={player.$id}
                            justify="space-between"
                            wrap="nowrap"
                        >
                            <Group wrap="nowrap">
                                <Avatar
                                    name={`${player.firstName} ${player.lastName}`}
                                    radius="xl"
                                    color="initials"
                                />
                                <Text fw={500}>
                                    {player.firstName} {player.lastName}
                                    {isCurrentUser && " (You)"}
                                </Text>
                            </Group>
                            <Select
                                size="sm"
                                value={currentRole}
                                data={roleOptions}
                                onChange={(value) =>
                                    handleRoleChange(player.$id, value)
                                }
                                disabled={
                                    fetcher.state !== "idle" ||
                                    (isCurrentUser && isLastOwner)
                                }
                                w={120}
                                allowDeselect={false}
                                comboboxProps={{ zIndex: 10000 }}
                            />
                        </Group>
                    );
                })}
            </Stack>
        </DrawerContainer>
    );
}
