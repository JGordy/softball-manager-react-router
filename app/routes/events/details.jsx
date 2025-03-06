import { useEffect } from 'react';

import { useOutletContext, useSubmit } from 'react-router';

import {
    Center,
    Container,
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

import { formatGameTime, formatTime } from '@/utils/dateTime';

import AvailabliityContainer from './components/AvailabliityContainer';
import LineupContainer from './components/LineupContainer';

import { getEventDetails } from './loader';
import { updateGame } from './action';

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
        player.availability = 'noResponse';
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
    } else if (_action === 'create-attendance') {
        try {
            const team = formData.get('team');
            const gameDate = formData.get('gameDate');
            const opponent = formData.get('opponent');
            const gameId = formData.get('gameId');

            const url = new URL(request.url);
            const baseUrl = url.origin;

            const response = await fetch(`${baseUrl}/api/create-attendance`, {
                method: 'POST',
                body: JSON.stringify({ team: JSON.parse(team), gameDate, opponent, gameId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
            }

            const formResponse = await response.json();

            // Return a success message or the form response
            return { success: true, formResponse };

        } catch (error) {
            console.error("Error creating attendance:", error);
            return { success: false, error: error.message };
        }
    }
}

export async function loader({ params, request }) {
    const { eventId } = params;

    return await getEventDetails({ eventId, request });
}

export default function EventDetails({ loaderData, actionData }) {
    // console.log('/events/:eventId > ', { loaderData });
    const submit = useSubmit();

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

    // TODO: Put this in an action so that we can refresh the ui when the action completes?
    const handleAttendanceFormClick = async () => {
        try {
            // Prepare the data to submit
            const formData = new FormData();
            formData.append('_action', 'create-attendance'); // Add an action identifier

            // Add any other necessary data to the FormData
            formData.append('team', JSON.stringify(team));
            formData.append('gameDate', gameDate);
            formData.append('opponent', opponent);
            formData.append('gameId', game.$id);

            // Use submit to trigger the action
            submit(formData, { method: 'post', action: `/events/${game.$id}` });
        } catch (error) {
            console.error("Error submitting attendance form:", error);
        }
    };

    return (
        <Container p="md" mih="90vh">
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
                        managerView={managerView}
                        playerChart={playerChart}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="availability" pt="md">
                    <AvailabliityContainer
                        availability={availability}
                        gameDate={gameDate}
                        handleAttendanceFormClick={handleAttendanceFormClick}
                        managerView={managerView}
                        players={players}
                    />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}