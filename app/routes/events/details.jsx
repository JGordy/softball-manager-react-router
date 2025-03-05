import { useEffect } from 'react';

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

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === 'update-game') {
        return updateGame({ values, eventId });
    }
};

export async function loader({ params, request }) {
    const { eventId } = params;

    return await getEventDetails({ eventId, request });
}

export default function EventDetails({ loaderData, actionData }) {
    console.log('/events/:eventId > ', { loaderData });

    const { game, season, teams, players, availability } = loaderData;
    const team = teams?.[0];

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
            const response = await fetch('/api/create-attendance', {
                method: 'POST',
                body: JSON.stringify({ team, gameDate, opponent, gameId: game.$id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
            }

            const formResponse = await response.json();
            console.log({ formResponse });
        } catch (error) {

        }
    };

    return (
        <Container p="md" mih="90vh">
            <Group justify="space-between">
                <BackButton text="Back to Events" />
                <EditButton setIsModalOpen={openModal} />
            </Group>
            {Object.keys(game) && (
                <>
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
                    <Tabs radius="md" defaultValue="lineup" mt="xl">
                        <Tabs.List grow justify="center">
                            <Tabs.Tab value="lineup" size="lg">
                                Lineup
                            </Tabs.Tab>
                            <Tabs.Tab value="availabliity" size="lg">
                                Availabliity
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="lineup" pt="md">
                            <LineupContainer
                                availablePlayers={players}
                                playerChart={playerChart}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="availabliity" pt="md">
                            <AvailabliityContainer
                                gameDate={gameDate}
                                players={players}
                                availability={availability}
                                handleAttendanceFormClick={handleAttendanceFormClick}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </>
            )}
        </Container>
    );
}