import { useEffect } from 'react';

import { useOutletContext } from 'react-router';

import {
    ActionIcon,
    Anchor,
    Card,
    Center,
    Divider,
    Flex,
    Group,
    Menu,
    Paper,
    Tabs,
    Text,
    Title,
} from '@mantine/core';
import { useDisclosure, useClipboard } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClock,
    IconCopy,
    IconDots,
    IconEdit,
    IconLocationFilled,
    IconMapPin,
    IconScoreboard,
    IconTrashX,
} from '@tabler/icons-react';

import BackButton from '@/components/BackButton';
import DrawerContainer from '@/components/DrawerContainer';

import AddGameResults from '@forms/AddGameResults';
import AddSingleGame from '@/forms/AddSingleGame';
import { createAttendanceForm, updateGame } from '@/actions/games';

import { getEventById } from '@/loaders/games';

import { formatGameTime, formatTime, getGameDayStatus } from '@/utils/dateTime';

import useModal from '@/hooks/useModal';

import AvailabliityContainer from './components/AvailabliityContainer';
import LineupContainer from './components/LineupContainer';

const availabilityOptions = [
    { value: 'Yes, I will be there', key: 'yes' },
    { value: 'No, I cannot attend', key: 'no' },
    { value: 'Maybe, I will let you know', key: 'maybe' },
];

function updatePlayerAvailability(responses, players) {
    const playersCopy = [...players];

    const availabilityMap = {};
    availabilityOptions.forEach(option => {
        availabilityMap[option.value] = option.key;
    });

    playersCopy.forEach(player => {
        player.availability = 'noresponse';
    });

    responses.forEach(response => {
        const player = playersCopy.find(p => p.email === response.respondentEmail);
        if (player) {
            player.available = availabilityMap[response.answer] || 'noResponse';
        }
    });

    return playersCopy;
}

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === 'update-game') {
        return updateGame({ values, eventId });
    }
    if (_action === 'create-attendance') {
        return createAttendanceForm({ values, request });
    }
    if (_action === 'save-chart') {
        return savePlayerChart({ values, eventId })
    }
}

export async function loader({ params, request }) {
    const { eventId } = params;

    return await getEventById({ eventId, request });
}

export default function EventDetails({ loaderData, actionData }) {
    console.log('/events/:eventId > ', { ...loaderData });

    const [opened, { open, close }] = useDisclosure(false);
    const { openModal, closeAllModals } = useModal();

    const clipboard = useClipboard({ timeout: 500 });

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const {
        game,
        managerId,
        season,
        teams,
        park,
        players,
        availability,
    } = loaderData;

    const team = teams?.[0];
    const managerView = managerId === currentUserId;

    const {
        gameDate,
        isHomeGame,
        opponent,
        opponentScore,
        playerChart,
        result,
        score,
        timeZone,
    } = game;

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const gameDayStatus = getGameDayStatus(gameDate);
    const gameIsPast = gameDayStatus === 'past';

    const { responses } = availability;

    const formHasResponses = responses && Object.keys(responses).length > 0;

    if (formHasResponses) updatePlayerAvailability(responses, players);

    const availablePlayers = players.filter(player => player.available === 'yes');

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.success) {
                    closeAllModals();
                } else if (actionData instanceof Error) {
                    console.error("Error parsing action data:", actionData);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON data:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

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

    const eventSettingsDropdown = (
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
                <Menu.Item leftSection={<IconTrashX size={14} />} color="red">
                    <Text>Delete Game</Text>
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );

    return (
        <>
            <Group justify="space-between">
                <BackButton text="Back to Events" />
                {managerView && eventSettingsDropdown}
            </Group>

            <Paper mt="xl">
                <Title order={4} align="center" mb="sm">
                    {team?.name} {isHomeGame ? 'vs' : '@'} {opponent || "TBD"}
                </Title>
                <Group justify="center" gap="xl" align="center">
                    <Card withBorder radius="md" px="xl">
                        <Text>{score || '0'}</Text>
                    </Card>

                    <div>-</div>

                    <Card withBorder radius="md" px="xl">
                        <Text>{opponentScore || '0'}</Text>
                    </Card>
                </Group>

                {gameIsPast && !result && (
                    <Center mt="md">
                        <Text size="sm" c="yellow">Game result pending*</Text>
                    </Center>
                )}
            </Paper>

            <Card withBorder radius="md" mt="xl" py="0px">
                <Card.Section my="xs" inheritPadding>
                    <Group gap="xs">
                        <IconClock size={18} />
                        {formattedGameTime}
                    </Group>
                </Card.Section>

                <Divider />

                <Card.Section my="xs" inheritPadding>
                    {park?.googleMapsURI ? (
                        <Group justify='space-between' onClick={open} c="green">
                            <Group gap="xs">
                                <IconMapPin size={18} />
                                {season?.location}
                            </Group>
                            <IconChevronRight size={18} />
                        </Group>
                    ) : (
                        <Group gap="xs">
                            <IconMapPin size={18} />
                            {season?.location}
                        </Group>
                    )}
                </Card.Section>
            </Card>

            <Tabs radius="md" defaultValue={(availablePlayers?.length > 7) ? 'lineup' : 'availability'} mt="xl">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="lineup">
                        Batting & Fielding
                    </Tabs.Tab>
                    <Tabs.Tab value="availability">
                        Player Availabliity
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="lineup" pt="md">
                    <LineupContainer
                        availablePlayers={availablePlayers}
                        game={game}
                        managerView={managerView}
                        playerChart={playerChart}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="availability" pt="md">
                    <AvailabliityContainer
                        availability={availability}
                        game={game}
                        managerView={managerView}
                        players={players}
                        team={team}
                    />
                </Tabs.Panel>
            </Tabs>

            {park && (
                <DrawerContainer
                    opened={opened}
                    onClose={close}
                    title="Location Details"
                >
                    <Flex align="center" gap="md" mb="xl">
                        <div>
                            <IconMapPin size={20} />
                        </div>
                        <div>
                            <Text size="lg" weight={500}>
                                {park?.displayName}
                            </Text>
                            <Text size="sm">
                                {park?.formattedAddress}
                            </Text>
                        </div>
                    </Flex>

                    <Anchor
                        href={park?.googleMapsURI}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Card c="green">
                            <Group gap="xs">
                                <IconLocationFilled size={18} />
                                <Text>View on Google Maps</Text>
                            </Group>
                        </Card>
                    </Anchor>

                    <Card
                        c="green"
                        mt="md"
                        onClick={() => clipboard.copy(park?.formattedAddress)}
                    >
                        <Group gap="xs">
                            <IconCopy size={18} />
                            <Text>{clipboard.copied ? 'Copied!' : 'Copy Address'}</Text>
                        </Group>
                    </Card>
                </DrawerContainer>
            )}
        </>
    );
}