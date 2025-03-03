import { Container, Flex, Group, Text, Title } from '@mantine/core';

import BackButton from '@/components/BackButton';

import { formatGameTime } from '@/utils/dateTime';

import { getEventDetails } from './loader';

export async function loader({ params }) {
    const { eventId } = params;

    return { game: await getEventDetails({ eventId }) }
}

export default function EventDetails({ loaderData }) {
    console.log('/events/:eventId > ', { loaderData });
    const { game } = loaderData;
    const { opponent, gameDate, isHomeGame, timeZone } = game;
    const team = game?.seasons?.teams[0]?.name;

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    return (
        <Container p="md" mih="90vh">
            <Group justify="space=between">
                <BackButton text="Back to Events" />
            </Group>
            {Object.keys(game) && (
                <Flex mt="lg" direction="column">
                    <Title order={4}>
                        {team} {isHomeGame ? 'vs' : ''} {opponent}
                    </Title>

                    <Text>{formattedGameTime}</Text>
                </Flex>
            )}
        </Container>
    );
}