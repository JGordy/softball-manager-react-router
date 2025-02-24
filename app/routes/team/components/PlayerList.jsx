import {
    Avatar,
    Button,
    Card,
    Flex,
    Text,
    Tooltip,
} from '@mantine/core'

import positions from '@/constants/positions';

import { IconPlus } from '@tabler/icons-react';

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
            {players.map(player => {
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
                            <Text size="lg">
                                {player.firstName} {player.lastName}
                            </Text>
                            {player.$id === managerId && (
                                <Text>Manager</Text>
                            )}
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