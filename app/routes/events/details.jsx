import {
    Button,
    Center,
    Container,
    Divider,
    Group,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconClock, IconMapPin } from '@tabler/icons-react';

import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';

import AddSingleGame from '@/forms/AddSingleGame';

import { formatGameTime } from '@/utils/dateTime';

import { getEventDetails } from './loader';

export async function loader({ params }) {
    const { eventId } = params;

    return await getEventDetails({ eventId });
}

export default function EventDetails({ loaderData }) {
    console.log('/events/:eventId > ', { loaderData });

    const { game, season, teams, players } = loaderData;
    const team = teams?.[0];

    const {
        gameDate,
        isHomeGame,
        opponent = "TBD",
        opponentScore,
        playerChart,
        result,
        score,
        timeZone,
    } = game;

    const chart = playerChart && JSON.parse(playerChart);
    console.log({ chart });

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const openModal = () => modals.open({
        title: 'Update Game Details',
        children: (
            <AddSingleGame
                action="update-game"
                actionRoute={`/events/${game.$id}`}
                teamId={team.$id}
                seasonId={season.$id}
                confirmText="Update Game"
            />
        ),
    });

    return (
        <Container p="md" mih="90vh">
            <Group justify="space-between">
                <BackButton text="Back to Events" />
                <EditButton setIsModalOpen={openModal} />
            </Group>
            {Object.keys(game) && (
                <>
                    <Title order={4} mt="xl">
                        {team?.name} {isHomeGame ? 'vs' : ''} {opponent}
                    </Title>

                    {result && (
                        <Center>
                            <Text>{result}</Text>
                            <Text>{score} - {opponentScore}</Text>
                        </Center>
                    )}

                    <Group mt="md">
                        <Group gap="xs">
                            <IconClock size={18} />
                            {formattedGameTime}
                        </Group>
                        <Group gap="xs">
                            <IconMapPin size={18} />
                            {season?.location}
                        </Group>
                    </Group>

                    <Divider size="sm" my="md" />

                    <Title order={4}>Lineup and field chart</Title>
                    {!chart && (
                        <>
                            <Text>Charts for this game have not yet been created. Start creating them below.</Text>
                            <Button mt="sm" onClick={() => { }} fullWidth>
                                Generate lineup and fielding chart
                            </Button>
                        </>
                    )}
                    {chart && (
                        <Text>We have a chart!</Text>
                    )}
                </>
            )}
        </Container>
    );
}