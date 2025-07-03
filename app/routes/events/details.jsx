import { useEffect } from 'react';

import { Form, useNavigation, useOutletContext } from 'react-router';

import {
    Anchor,
    Button,
    Card,
    Flex,
    Group,
    Tabs,
    Text,
} from '@mantine/core';
import { useDisclosure, useClipboard } from '@mantine/hooks';

import {
    IconCopy,
    IconLocationFilled,
    IconMapPin,
} from '@tabler/icons-react';

import BackButton from '@/components/BackButton';
import DrawerContainer from '@/components/DrawerContainer';

import { createAttendanceForm, deleteGame, savePlayerChart, updateGame } from '@/actions/games';

import { getEventById } from '@/loaders/games';

import { formatGameTime, getGameDayStatus } from '@/utils/dateTime';

import useModal from '@/hooks/useModal';

import MenuContainer from './components/MenuContainer';
import Scoreboard from './components/Scoreboard';
import DetailsCard from './components/DetailsCard';
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
    if (_action === 'delete-game') {
        return deleteGame({ eventId, values });
    }
}

export async function loader({ params, request }) {
    const { eventId } = params;

    return await getEventById({ eventId, request });
}

export default function EventDetails({ loaderData, actionData }) {
    console.log('/events/:eventId > ', { ...loaderData });

    const [locationDrawerOpened, locationDrawerHandlers] = useDisclosure(false);
    const [deleteDrawerOpened, deleteDrawerHandlers] = useDisclosure(false);

    const navigation = useNavigation();
    const { closeAllModals } = useModal();

    const clipboard = useClipboard({ timeout: 500 });

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const isDeleting = navigation.state === 'submitting' &&
        navigation.formData?.get('_action') === 'delete-game';

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
        playerChart,
        result,
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

    return (
        <>
            <Group justify="space-between">
                <BackButton text="Back to Events" />
                {managerView && (
                    <MenuContainer
                        game={game}
                        gameIsPast={gameIsPast}
                        openDeleteDrawer={deleteDrawerHandlers.open}
                        result={result}
                        team={team}
                    />
                )}
            </Group>

            <Scoreboard
                game={game}
                gameIsPast={gameIsPast}
                team={team}
            />

            <DetailsCard
                formattedGameTime={formattedGameTime}
                park={park}
                season={season}
                locationDrawerHandlers={locationDrawerHandlers}
            />

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

            {managerView && (
                <DrawerContainer
                    opened={deleteDrawerOpened}
                    onClose={deleteDrawerHandlers.close}
                    title="Delete Game"
                >
                    <Text>Are you sure you want to delete this game? There is no undoing this action.</Text>
                    <Form method="post">
                        <input type="hidden" name="_action" value="delete-game" />
                        <input type="hidden" name="userId" value={currentUserId} />
                        <Button
                            type="submit"
                            color="red"
                            variant="filled"
                            mt="lg"
                            fullWidth
                            loading={isDeleting}
                            disabled={isDeleting}
                        >
                            Yes, Delete this Game
                        </Button>
                    </Form>
                </DrawerContainer>
            )}

            {park && (
                <DrawerContainer
                    opened={locationDrawerOpened}
                    onClose={locationDrawerHandlers.close}
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