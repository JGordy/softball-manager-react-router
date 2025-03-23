import { useEffect } from 'react';

import { useOutletContext } from 'react-router';

import {
    Center,
    Divider,
    Group,
    Tabs,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconClock, IconMapPin } from '@tabler/icons-react';

import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';

import AddSingleGame from '@/forms/AddSingleGame';
import { createAttendanceForm, updateGame } from '@/actions/games';

import { getEventById } from '@/loaders/games';

import { formatGameTime, formatTime } from '@/utils/dateTime';

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
    // console.log('/events/:eventId > ', { loaderData });

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const {
        game,
        managerId,
        season,
        teams,
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

    const { responses } = availability;

    const formHasResponses = responses && Object.keys(responses).length > 0;

    if (formHasResponses) updatePlayerAvailability(responses, players);

    const availablePlayers = players.filter(player => player.available === 'yes');

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.success) {
                    modals.closeAll();
                } else if (actionData instanceof Error) {
                    console.error("Error parsing action data:", actionData);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON data:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const openModal = () => modals.open({
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
        <>
            <Group justify="space-between">
                <BackButton text="Back to Events" />
                {managerView && <EditButton setIsModalOpen={openModal} />}
            </Group>

            <Title order={4} mt="xl" align="center">
                {team?.name} {isHomeGame ? 'vs' : '@'} {opponent || "TBD"}
            </Title>

            {result && (
                <>
                    <Divider size="sm" my="md" />

                    <Center>
                        <Text>{result}</Text>
                        <Text>{score} - {opponentScore}</Text>
                    </Center>

                    <Divider size="sm" my="md" />
                </>
            )}

            <Group gap="xs" justify="center" mt="md">
                <IconClock size={18} />
                {formattedGameTime}
            </Group>

            <Group gap="xs" justify="center" mt="md">
                <IconMapPin size={18} />
                {season?.location}
            </Group>

            {/* <Title order={5} mt="lg" align="center">See detailed information for your upcoming and past games</Title> */}
            <Tabs radius="md" defaultValue={(availablePlayers?.length > 7) ? 'lineup' : 'availability'} mt="xl">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="lineup" size="lg">
                        Batting & Fielding
                    </Tabs.Tab>
                    <Tabs.Tab value="availability" size="lg">
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
        </>
    );
}