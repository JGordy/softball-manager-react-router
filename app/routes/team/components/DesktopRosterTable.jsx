import { useState, useMemo } from "react";
import {
    Tabs,
    Table,
    Avatar,
    Group,
    Text,
    Card,
    Tooltip,
    Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconShieldCheck,
    IconBallBaseball,
    IconUserSquareRounded,
    IconMap2,
} from "@tabler/icons-react";

import positions from "@/constants/positions";

import DrawerContainer from "@/components/DrawerContainer";
import TabsWrapper from "@/components/TabsWrapper";
import PlayerDetails from "@/components/PlayerDetails";
import PersonalDetails from "@/components/PersonalDetails";
import ContactSprayChart from "@/components/ContactSprayChart";

import classes from "@/styles/desktopRosterTable.module.css";

const PlayerPositions = ({ preferredPositions, playerId }) => {
    const positionCount = preferredPositions?.length || 0;
    const maxVisible = 4;
    const hasOverflow = positionCount > maxVisible;
    const displayCount = hasOverflow ? maxVisible - 1 : maxVisible;
    const visiblePositions = preferredPositions?.slice(0, displayCount) || [];
    const overflowCount = positionCount - displayCount;

    return (
        <Avatar.Group>
            {visiblePositions.map((position) => (
                <Tooltip key={playerId + position} label={position} withArrow>
                    <Avatar
                        name={positions[position].initials}
                        alt={position}
                        color="initials"
                        size="sm"
                    />
                </Tooltip>
            ))}
            {hasOverflow && <Avatar size="sm">+{overflowCount}</Avatar>}
        </Avatar.Group>
    );
};

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

            {selectedPlayerId && (
                <DrawerContainer
                    opened={opened}
                    onClose={close}
                    title={`${selectedPlayer?.firstName}'s Details`}
                >
                    <TabsWrapper defaultValue="player">
                        <Tabs.Tab value="player">
                            <Group gap="xs" align="center" justify="center">
                                <IconBallBaseball size={16} />
                                Player
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="personal">
                            <Group gap="xs" align="center" justify="center">
                                <IconUserSquareRounded size={16} />
                                Personal
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="spray">
                            <Group gap="xs" align="center" justify="center">
                                <IconMap2 size={16} />
                                Charts
                            </Group>
                        </Tabs.Tab>

                        <Tabs.Panel value="player">
                            <PlayerDetails player={selectedPlayer} />
                        </Tabs.Panel>

                        <Tabs.Panel value="personal">
                            <PersonalDetails
                                user={user}
                                player={selectedPlayer}
                                managerView={managerView}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="spray" pt="lg">
                            <ContactSprayChart hits={playerHits} />
                        </Tabs.Panel>
                    </TabsWrapper>
                </DrawerContainer>
            )}
        </>
    );
}
