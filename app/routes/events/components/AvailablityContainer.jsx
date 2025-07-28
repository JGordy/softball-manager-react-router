import { useEffect } from 'react';
import { useOutletContext, useFetcher } from 'react-router';

import {
    ActionIcon,
    Card,
    Collapse,
    Divider,
    Group,
    LoadingOverlay,
    Radio,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronDown,
    IconCircleCheckFilled,
    IconHelpTriangleFilled,
    IconMessageCircleOff,
    IconSquareXFilled,
} from '@tabler/icons-react';

import positions from '@/constants/positions';

const availabilityData = {
    accepted: {
        icon: <IconCircleCheckFilled size={24} color="green" />,
        label: 'Yes',
        value: 'accepted',
    },
    declined: {
        icon: <IconSquareXFilled size={24} color="red" />,
        label: 'No',
        value: 'declined',
    },
    tentative: {
        icon: <IconHelpTriangleFilled size={24} color="orange" />,
        label: 'Maybe',
        value: 'tentative',
    },
    noresponse: {
        icon: <IconMessageCircleOff size={24} color="gray" />,
        label: 'No Response',
        value: '',
    },
}

const AvailabilityOptionsContainer = ({ attendance, game, player, managerView, currentUserId, isGamePast }) => {

    const fetcher = useFetcher();
    const [opened, { close, toggle }] = useDisclosure(false);

    const renderToggle = (managerView || currentUserId === player.$id) && !isGamePast;


    // This effect will close the collapse after a successful submission.
    useEffect(() => {
        // Check for a successful action response from the fetcher
        if (fetcher.state === 'idle' && fetcher.data?.success) {
            close();
        }
    }, [fetcher.state, fetcher.data, close]);

    const handleAttendanceChange = (text, playerId) => {
        try {
            const formData = new FormData();
            formData.append('_action', 'update-attendance');
            formData.append('playerId', playerId);
            formData.append('status', availabilityData[text].value);
            formData.append('updatedBy', currentUserId);

            fetcher.submit(formData, { method: 'post', action: `/events/${game.$id}` });
        } catch (error) {
            console.error('Error submitting attendance form:', error);
        }
    };

    return (
        <Card
            key={player.$id}
            shadow="sm"
            radius="md"
            p="sm"
            mt="xs"
            pos="relative"
        >
            <LoadingOverlay
                visible={fetcher.state === 'loading'}
                overlayProps={{ blur: 2, radius: 'md' }}
                loaderProps={{ color: 'green', type: 'dots', size: 'lg' }}
            />
            <Group justify="space-between">
                <Text fw={700}>{player.firstName} {player.lastName}</Text>
                <Text>{positions[player.preferredPositions?.[0]].initials}</Text>
                <Group>
                    {availabilityData[attendance?.status || 'noresponse'].icon}
                    {(renderToggle) && (
                        <>
                            <Divider orientation="vertical" />
                            <ActionIcon variant="transparent" onClick={toggle}>
                                <IconChevronDown style={{ width: '70%', height: '70%' }} stroke={1.5} />
                            </ActionIcon>
                        </>
                    )}
                </Group>
            </Group>

            <Collapse in={opened}>
                <Radio.Group
                    onChange={(value) => handleAttendanceChange(value, player.$id)}
                    name="status"
                    mt="sm"
                    label="Will you be attending the game?"
                    // description={`Last updated ${attendance?.$updatedAt}`}
                    defaultValue={attendance?.status || 'noresponse'}
                >
                    <Group justify="space-between" mt="sm">
                        {Object.keys(availabilityData).map(key => {
                            const item = availabilityData[key];
                            return key !== 'noresponse' && (
                                <Radio.Card
                                    radius="xl"
                                    value={key}
                                    key={`${key}-${player.$id}`}
                                    maw="30%"
                                    py="5px"
                                >
                                    <Group wrap="nowrap" align="center" justify="center" gap="5px">
                                        {item.icon}
                                        <Text>{item.label}</Text>
                                    </Group>
                                </Radio.Card>
                            )
                        })}
                    </Group>
                </Radio.Group>
            </Collapse>
        </Card>
    );
};

export default function AvailabliityContainer({
    attendance,
    game,
    managerView,
    players,
}) {

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const { gameDate, $id: gameId } = game;

    const today = new Date();
    const gameDay = new Date(gameDate);
    const isGameToday = gameDay.toDateString() === today.toDateString();
    const isGamePast = gameDay < today && !isGameToday;

    const renderPlayerAvailability = () => players.map(player => (
        <AvailabilityOptionsContainer
            key={player.$id}
            attendance={attendance?.documents?.find(a => a.playerId === player.$id)}
            currentUserId={currentUserId}
            game={game}
            isGamePast={isGamePast}
            managerView={managerView}
            player={player}
        />
    ));

    return (
        <>
            <Group justify="space-between" wrap="nowrap" mb="lg">
                {Object.keys(availabilityData).map(key => (
                    <Stack align="center" gap="2px" key={key}>
                        {availabilityData[key].icon}{availabilityData[key].label}
                    </Stack>
                ))}
            </Group>

            <Divider size="xs" mb="md" />

            {players?.length > 0 && renderPlayerAvailability()}
        </>
    );
};