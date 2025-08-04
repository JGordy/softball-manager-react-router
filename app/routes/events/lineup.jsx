import { Container, Group } from '@mantine/core';

import { useOutletContext } from 'react-router';

import { getEventWithPlayerCharts } from '@/loaders/games';

import { savePlayerChart } from '@/actions/lineups';

import BackButton from '@/components/BackButton';

import LineupContainer from './components/LineupContainer';

import addPlayerAvailability from './utils/addPlayerAvailability';

export async function loader({ params, request }) {
    const { eventId } = params;
    console.log('/events/:eventId > ', { eventId });

    return await getEventWithPlayerCharts({ eventId, request });
}

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === 'save-chart') {
        return savePlayerChart({ eventId, values });
    }
}

function Lineup({ loaderData }) {
    console.log('/events/:eventId/lineup > ', { ...loaderData });

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const {
        // game,
        // deferredData,
        managerId,
        players,
        attendance,
        // season,
        // teams,
        ...rest
    } = loaderData;

    const managerView = managerId === currentUserId;

    const playersWithAvailability = addPlayerAvailability(attendance, players);

    return (
        <Container p="md">
            <Group mt="lg" mb="xl">
                <BackButton text="Back to event details" />
            </Group>
            <LineupContainer
                managerView={managerView}
                players={playersWithAvailability}
                {...rest}
            />
        </Container>
    );
}

export default Lineup;