import {
    Avatar,
    Button,
    Card,
    Flex,
    Text,
    Tooltip,
    ScrollArea,
} from '@mantine/core'

import positions from '@/constants/positions';

import { IconPlus } from '@tabler/icons-react';

export default function PlayerList({
    players,
    managerId,
    managerView,
    handlePlayerListModal,
    handleAddPlayerModal,
    handlePlayerDetailsModal,
    primaryColor,
}) {

    const handlePlayerCardClick = (playerId) => {
        handlePlayerDetailsModal(playerId);
    }

    return (
        <>
            <ScrollArea w="100%">
                {players.map(player => {
                    return (
                        <Card
                            key={player.$id}
                            mt="sm"
                            radius="md"
                            padding="sm"
                            withBorder
                            w={750}
                            onClick={() => handlePlayerCardClick(player.$id)}
                        >
                            <Flex wrap="nowrap" justify="space-between" align="center">
                                <Text size="lg">
                                    {player.firstName} {player.lastName}
                                </Text>
                                <Avatar.Group>
                                    {player?.preferredPositions?.map(position => (
                                        <Tooltip key={player.$id + position} label={position} withArrow>
                                            <Avatar name={positions[position].initials} alt={position} color="initials" />
                                        </Tooltip>
                                    ))}
                                </Avatar.Group>
                                {/* {getPlayerStatus(player)} */}
                                <Text>{player.$id === managerId ? 'Manager' : 'Player'}</Text>
                                {managerView && <Text>{player.email}</Text>}
                                {managerView && <Text>{player.phoneNumber}</Text>}
                            </Flex>
                        </Card>
                    )
                })}
            </ScrollArea>

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