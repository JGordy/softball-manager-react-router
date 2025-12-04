import { useFetcher } from "react-router";
import { Avatar, Group, Select, Stack, Text } from "@mantine/core";
import DrawerContainer from "@/components/DrawerContainer";

export default function ManageRolesDrawer({
    opened,
    onClose,
    players,
    teamId,
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

    const getRoleWeight = (roles) => {
        if (roles.includes("owner")) return 3;
        if (roles.includes("manager")) return 2;
        return 1;
    };

    const sortedPlayers = [...players].sort((a, b) => {
        return getRoleWeight(b.roles) - getRoleWeight(a.roles);
    });

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
                                </Text>
                            </Group>
                            <Select
                                size="sm"
                                value={currentRole}
                                data={roleOptions}
                                onChange={(value) =>
                                    handleRoleChange(player.$id, value)
                                }
                                disabled={fetcher.state !== "idle"}
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
