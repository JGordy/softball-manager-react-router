import { useMemo, useState } from "react";

import { Card, Flex, Group, ScrollArea, Text } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconChevronRight, IconClipboardCheck } from "@tabler/icons-react";

import PlayerPositions from "./PlayerPositions";
import PlayerDetailsDrawer from "./PlayerDetailsDrawer";

export default function PlayerList({
    players,
    managerIds,
    managerView,
    user,
    teamLogs = [],
    teamId,
}) {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const selectedPlayer = players.find(
        (player) => player.$id === selectedPlayerId,
    );

    const [opened, { open: openPlayerDetails, close }] = useDisclosure(false);

    const playerHits = useMemo(() => {
        if (!selectedPlayerId) return [];
        return teamLogs.filter((log) => log.playerId === selectedPlayerId);
    }, [teamLogs, selectedPlayerId]);

    const openPlayerDetailsDrawer = (playerId) => {
        setSelectedPlayerId(playerId);
        openPlayerDetails();
    };

    return (
        <>
            {!players.length && (
                <Text mt="lg" align="center">
                    No players currently listed for this team.
                </Text>
            )}

            <ScrollArea h="50vh" mt="md">
                {players.length > 0 &&
                    players.map((player) => {
                        return (
                            <Card
                                key={player.$id}
                                mt="sm"
                                radius="md"
                                padding="sm"
                                withBorder
                                onClick={() =>
                                    openPlayerDetailsDrawer(player.$id)
                                }
                            >
                                <Flex justify="space-between" align="center">
                                    <Group gap="3px">
                                        <Text size="lg">
                                            {player.firstName} {player.lastName}
                                        </Text>
                                        {managerIds.includes(player.$id) && (
                                            <Text component="span">
                                                <IconClipboardCheck size={20} />
                                            </Text>
                                        )}
                                        {player.status === "unverified" && (
                                            <Text
                                                size="xs"
                                                c="orange"
                                                fw={400}
                                                ml="xs"
                                                style={{
                                                    backgroundColor:
                                                        "rgba(255, 165, 0, 0.1)",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    border: "1px solid orange",
                                                }}
                                            >
                                                INVITED
                                            </Text>
                                        )}
                                    </Group>
                                    <Group>
                                        <PlayerPositions
                                            preferredPositions={
                                                player.preferredPositions
                                            }
                                            playerId={player.$id}
                                        />
                                        <IconChevronRight size={20} />
                                    </Group>
                                </Flex>
                            </Card>
                        );
                    })}
            </ScrollArea>

            <PlayerDetailsDrawer
                opened={opened}
                close={close}
                selectedPlayer={selectedPlayer}
                user={user}
                managerView={managerView}
                playerHits={playerHits}
                teamId={teamId}
                size="xl"
            />
        </>
    );
}
