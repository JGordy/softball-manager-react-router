import { useEffect } from 'react';

import { Form, useNavigation, useOutletContext } from 'react-router';

import {
    Box,
    Button,
    Group,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import BackButton from '@/components/BackButton';
import DrawerContainer from '@/components/DrawerContainer';

import { createAttendanceForm, deleteGame, savePlayerChart, updateGame } from '@/actions/games';

import { getEventById } from '@/loaders/games';

import { getGameDayStatus } from '@/utils/dateTime';

import useModal from '@/hooks/useModal';

import MenuContainer from './components/MenuContainer';
import Scoreboard from './components/Scoreboard';
import DetailsCard from './components/DetailsCard';
import RosterDetails from './components/RosterDetails';

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

    const [deleteDrawerOpened, deleteDrawerHandlers] = useDisclosure(false);

    const navigation = useNavigation();
    const { closeAllModals } = useModal();

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
    } = game;

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
            <Box
                className="event-details-hero"
                pt="xl"
                pb="100px"
            >
                <Group justify="space-between" mx="md">
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
            </Box>

            <DetailsCard
                game={game}
                park={park}
                season={season}
                team={team}
            />

            <RosterDetails
                availability={availability}
                availablePlayers={availablePlayers}
                game={game}
                managerView={managerView}
                playerChart={playerChart}
                players={players}
                team={team}
            />

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
        </>
    );
}