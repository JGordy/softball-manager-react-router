import { useState, useMemo } from "react";
import { Table, Avatar, Group, Text, Card, Badge } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconShieldCheck } from "@tabler/icons-react";

import PlayerDetailsDrawer from "./PlayerDetailsDrawer";

import classes from "@/styles/desktopRosterTable.module.css";
import PlayerPositions from "./PlayerPositions";

export default function DesktopRosterTable({
    players,
    managerIds,
    managerView,
    user,
    teamLogs = [],
}) {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const selectedPlayer = players.find((p) => p.$id === selectedPlayerId);
    const [opened, { open: openPlayerDetails, close }] = useDisclosure(false);

    const playerHits = useMemo(() => {
        if (!selectedPlayerId) return [];
        return teamLogs.filter((log) => log.playerId === selectedPlayerId);
    }, [teamLogs, selectedPlayerId]);

    const openDrawer = (playerId) => {
        setSelectedPlayerId(playerId);
        openPlayerDetails();
    };

    if (!players?.length) {
        return (
            <Card withBorder radius="md">
                <Text c="dimmed">
                    No players currently listed for this team.
                </Text>
            </Card>
        );
    }

    const rows = players.map((player) => {
        const isManager = managerIds.includes(player.$id);

        return (
            <Table.Tr
                key={player.$id}
                onClick={() => openDrawer(player.$id)}
                className={classes.tableRow}
                style={{ cursor: "pointer" }}
            >
                <Table.Td>
                    <Group gap="sm">
                        <Avatar
                            color="initials"
                            name={`${player.firstName} ${player.lastName}`}
                            radius="xl"
                        />
                        <div>
                            <Text fz="sm" fw={500}>
                                {player.firstName} {player.lastName}
                            </Text>
                            <Text fz="xs" c="dimmed">
                                {player.email || "No email"}
                            </Text>
                        </div>
                    </Group>
                </Table.Td>
                <Table.Td>
                    {isManager ? (
                        <Badge
                            color="blue"
                            variant="light"
                            leftSection={<IconShieldCheck size={12} />}
                        >
                            Manager
                        </Badge>
                    ) : (
                        <Badge color="gray" variant="light">
                            Player
                        </Badge>
                    )}
                </Table.Td>
                <Table.Td>
                    <PlayerPositions
                        preferredPositions={player.preferredPositions}
                        playerId={player.$id}
                    />
                </Table.Td>
                <Table.Td>
                    <Badge
                        color={
                            player.gender?.toLowerCase() === "female"
                                ? "pink"
                                : "indigo"
                        }
                        variant="dot"
                    >
                        {player.gender || "Unknown"}
                    </Badge>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <>
            <Card withBorder radius="md" p={0} bg="var(--mantine-color-body)">
                <Table
                    verticalSpacing="md"
                    horizontalSpacing="lg"
                    striped
                    highlightOnHover
                >
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Role</Table.Th>
                            <Table.Th>Positions</Table.Th>
                            <Table.Th>Gender</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Card>

            <PlayerDetailsDrawer
                opened={opened}
                close={close}
                selectedPlayer={selectedPlayer}
                user={user}
                managerView={managerView}
                playerHits={playerHits}
            />
        </>
    );
}
