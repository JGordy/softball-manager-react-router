import { Container } from '@mantine/core';

import { useOutletContext } from 'react-router';

import { getEventWithPlayerCharts } from '@/loaders/games';

import LineupContainer from './components/LineupContainer';

import addPlayerAvailability from './utils/addPlayerAvailability';

export async function loader({ params, request }) {
    const { eventId } = params;
    console.log('/events/:eventId > ', { eventId });

    return await getEventWithPlayerCharts({ eventId, request });
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
        <Container>
            <LineupContainer
                managerView={managerView}
                players={playersWithAvailability}
                {...rest}
            />
        </Container>
    );
}

export default Lineup;