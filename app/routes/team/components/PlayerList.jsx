import {
    Avatar,
    Button,
    Card,
    Flex,
    Group,
    Text,
    Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals';

import positions from '@/constants/positions';

import { IconPlus, IconClipboardCheck } from '@tabler/icons-react';

export default function PlayerList({
    players,
    managerId,
    managerView,
    handleAddPlayerModal,
    handlePlayerDetailsModal,
    primaryColor,
}) {

    const handlePlayerCardClick = (playerId) => {
        handlePlayerDetailsModal(playerId);
    }

    return (
        <>
            {(!players.length) && (
                <Text mt="lg" align="center">
                    No players currently listed for this team.
                </Text>
            )}

            {(players.length > 0) && players.map(player => {
                return (
                    <Card
                        key={player.$id}
                        mt="sm"
                        radius="md"
                        padding="sm"
                        withBorder
                        onClick={() => handlePlayerCardClick(player.$id)}
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
                            <Avatar.Group>
                                {player?.preferredPositions?.map(position => (
                                    <Tooltip key={player.$id + position} label={position} withArrow>
                                        <Avatar name={positions[position].initials} alt={position} color="initials" />
                                    </Tooltip>
                                ))}
                            </Avatar.Group>
                        </Flex>
                    </Card>
                )
            })}

            {managerView && (
                <Button
                    mt="sm"
                    color={primaryColor}
                    onClick={handleAddPlayerModal}
                    autoContrast
                    fullWidth
                >
                    <IconPlus size={20} />
                    Add Player
                </Button>
            )}
        </>
    );
};