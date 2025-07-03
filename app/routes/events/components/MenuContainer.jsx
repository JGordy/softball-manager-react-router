import {
    ActionIcon,
    Menu,
    Text,
} from '@mantine/core';

import {
    IconDots,
    IconEdit,
    IconScoreboard,
    IconTrashX,
} from '@tabler/icons-react';

import AddGameResults from '@/forms/AddGameResults';
import AddSingleGame from '@/forms/AddSingleGame';

import useModal from '@/hooks/useModal';

import { formatTime } from '@/utils/dateTime';

export default function MenuContainer({
    game = {},
    gameIsPast,
    openDeleteDrawer = () => { },
    result,
    season = {},
    team = {},
}) {

    const { openModal } = useModal();

    const openGameResultsModal = () => openModal({
        title: 'Add Results for this game',
        children: (
            <AddGameResults
                actionRoute={`/events/${game.$id}`}
                teamId={team.$id}
                defaults={{
                    score: game?.score || 0,
                    opponentScore: game?.opponentScore || 0,
                    result: game?.result || null,
                }}
            />
        ),
    });

    const openEditGameModal = () => openModal({
        title: 'Update Game Details',
        children: (
            <AddSingleGame
                action="update-game"
                actionRoute={`/events/${game.$id}`}
                defaults={{
                    isHomeGame: 'false',
                    gameTime: formatTime(game.gameDate, game.timeZone),
                    gameDate: game.gameDate,
                }}
                teamId={team.$id}
                seasonId={season.$id}
                confirmText="Update Game"
            />
        ),
    });

    return (
        <Menu shadow="md" withArrow offset={0}>
            <Menu.Target>
                <ActionIcon variant="light" radius="xl" size="lg">
                    <IconDots />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>
                    <Text size="xs">Game Details</Text>
                </Menu.Label>
                {gameIsPast && (
                    <Menu.Item onClick={openGameResultsModal} leftSection={<IconScoreboard size={14} />}>
                        <Text>{`${result ? 'Update' : 'Add'} game results`}</Text>
                    </Menu.Item>
                )}
                <Menu.Item onClick={openEditGameModal} leftSection={<IconEdit size={14} />}>
                    <Text>Edit Game Details</Text>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>
                    <Text size="xs">Danger zone</Text>
                </Menu.Label>
                <Menu.Item leftSection={<IconTrashX size={14} />} color="red" onClick={openDeleteDrawer}>
                    <Text>Delete Game</Text>
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}