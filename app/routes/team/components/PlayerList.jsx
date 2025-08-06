import { useState } from 'react';

import {
    Avatar,
    Button,
    Card,
    Flex,
    Group,
    ScrollArea,
    Tabs,
    Text,
    Tooltip,
} from '@mantine/core'

import { useDisclosure } from '@mantine/hooks';

import {
    IconBallBaseball,
    IconChevronRight,
    IconClipboardCheck,
    IconPlus,
    IconUserSquareRounded,
} from '@tabler/icons-react';

import DrawerContainer from '@/components/DrawerContainer';
import PlayerDetails from '@/components/PlayerDetails';
import PersonalDetails from '@/components/PersonalDetails';

import AddPlayer from '@/forms/AddPlayer';

import useModal from '@/hooks/useModal';

import positions from '@/constants/positions';

export default function PlayerList({
    players,
    managerId,
    managerView,
    primaryColor,
    teamId,
}) {

    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const selectedPlayer = players.find(player => player.$id === selectedPlayerId);

    const [opened, { open: openPlayerDetails, close }] = useDisclosure(false);

    const { openModal } = useModal();

    const openAddPlayerModal = () => openModal({
        title: 'Add a New Player',
        children: (
            <AddPlayer
                actionRoute={`/team/${teamId}`}
                buttonColor={primaryColor}
                inputsToDisplay={['name', 'gender', 'contact', 'positions']}
            />
        ),
    });

    const openPlayerDetailsDrawer = (playerId) => {
        setSelectedPlayerId(playerId);
        openPlayerDetails();
    }

    return (
        <>
            {(!players.length) && (
                <Text mt="lg" align="center">
                    No players currently listed for this team.
                </Text>
            )}

            {managerView && (
                <Button
                    mt="md"
                    color={primaryColor}
                    onClick={openAddPlayerModal}
                    autoContrast
                    fullWidth
                >
                    <IconPlus size={20} />
                    Add Player
                </Button>
            )}

            <ScrollArea h="50vh">
                {(players.length > 0) && players.map(player => {
                    return (
                        <Card
                            key={player.$id}
                            mt="sm"
                            radius="md"
                            padding="sm"
                            withBorder
                            onClick={() => openPlayerDetailsDrawer(player.$id)}
                        >
                            <Flex justify="space-between" align="center">
                                <Group gap="3px">
                                    <Text size="lg">
                                        {player.firstName} {player.lastName}
                                    </Text>
                                    {player.$id === managerId && (
                                        <Text>
                                            <IconClipboardCheck size={20} />
                                        </Text>
                                    )}
                                </Group>
                                <Group>
                                    <Avatar.Group>
                                        {player?.preferredPositions?.map(position => (
                                            <Tooltip key={player.$id + position} label={position} withArrow>
                                                <Avatar name={positions[position].initials} alt={position} color="initials" />
                                            </Tooltip>
                                        ))}
                                    </Avatar.Group>
                                    <IconChevronRight size={20} />
                                </Group>
                            </Flex>
                        </Card>
                    )
                })}
            </ScrollArea>

            {selectedPlayerId && (
                <DrawerContainer
                    opened={opened}
                    onClose={close}
                    size="xl"
                    title={`${selectedPlayer.firstName}'s Details`}
                >
                    <Tabs radius="md" defaultValue="player" mt="md">
                        <Tabs.List justify="center" grow>
                            <Tabs.Tab value="player" leftSection={<IconBallBaseball size={16} />}>
                                Player
                            </Tabs.Tab>
                            <Tabs.Tab value="personal" leftSection={<IconUserSquareRounded size={16} />}>
                                Personal
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="player">
                            <PlayerDetails player={selectedPlayer} />
                        </Tabs.Panel>

                        <Tabs.Panel value="personal">
                            <PersonalDetails
                                player={selectedPlayer}
                                managerView={managerView}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </DrawerContainer>
            )}
        </>
    );
};