import { useMemo, useState } from "react";

import {
    Avatar,
    Card,
    Flex,
    Group,
    ScrollArea,
    Text,
    Tooltip,
} from "@mantine/core";

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
                                            <Text>
                                                <IconClipboardCheck size={20} />
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
                size="xl"
            />
        </>
    );
}
