import { useState } from "react";

import {
    Avatar,
    Card,
    Flex,
    Group,
    ScrollArea,
    Tabs,
    Text,
    Tooltip,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
    IconBallBaseball,
    IconChevronRight,
    IconClipboardCheck,
    IconUserSquareRounded,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import PlayerDetails from "@/components/PlayerDetails";
import PersonalDetails from "@/components/PersonalDetails";
import TabsWrapper from "@/components/TabsWrapper";

import positions from "@/constants/positions";

export default function PlayerList({ players, managerIds, managerView }) {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const selectedPlayer = players.find(
        (player) => player.$id === selectedPlayerId,
    );

    const [opened, { open: openPlayerDetails, close }] = useDisclosure(false);

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
                                        <Avatar.Group>
                                            {player?.preferredPositions?.map(
                                                (position) => (
                                                    <Tooltip
                                                        key={
                                                            player.$id +
                                                            position
                                                        }
                                                        label={position}
                                                        withArrow
                                                    >
                                                        <Avatar
                                                            name={
                                                                positions[
                                                                    position
                                                                ].initials
                                                            }
                                                            alt={position}
                                                            color="initials"
                                                        />
                                                    </Tooltip>
                                                ),
                                            )}
                                        </Avatar.Group>
                                        <IconChevronRight size={20} />
                                    </Group>
                                </Flex>
                            </Card>
                        );
                    })}
            </ScrollArea>

            {selectedPlayerId && (
                <DrawerContainer
                    opened={opened}
                    onClose={close}
                    size="xl"
                    title={`${selectedPlayer.firstName}'s Details`}
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

                        <Tabs.Panel value="player">
                            <PlayerDetails player={selectedPlayer} />
                        </Tabs.Panel>

                        <Tabs.Panel value="personal">
                            <PersonalDetails
                                player={selectedPlayer}
                                managerView={managerView}
                            />
                        </Tabs.Panel>
                    </TabsWrapper>
                </DrawerContainer>
            )}
        </>
    );
}
