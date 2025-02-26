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

import { IconPlus, IconClipboardCheck } from '@tabler/icons-react';

import PlayerDetails from '@/components/PlayerDetails';
import PersonalDetails from '@/components/PersonalDetails';

import positions from '@/constants/positions';

export default function PlayerList({
    players,
    managerId,
    managerView,
    primaryColor,
}) {

    const openAddPlayerModal = () => modals.open({
        title: 'Add a New Player',
        children: (
            <>Form Content</>
            // <AddPlayer
            //     action="add-single-game"
            //     actionRoute={`/team/${teamId}`}
            //     teamId={teamId}
            //     seasonId={null}
            //     seasons={seasons}
            //     confirmText="Create Player"
            // />
        ),
    });

    const openPlayerDetailsModal = (playerId) => {
        const player = players.find(player => player.$id === playerId);
        return modals.open({
            title: `${player.firstName} ${player.lastName}'s Details`,
            children: (
                <>
                    <PersonalDetails player={player} managerView={managerView} />
                    <PlayerDetails player={player} />
                </>
            ),
        })
    };

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
                        onClick={() => openPlayerDetailsModal(player.$id)}
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
                    onClick={openAddPlayerModal}
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