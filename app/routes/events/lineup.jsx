import { useState } from "react";

import { Container, Group } from "@mantine/core";
import { useListState } from "@mantine/hooks";

import { useOutletContext } from "react-router";

import { getEventWithPlayerCharts } from "@/loaders/games";

import { savePlayerChart } from "@/actions/lineups";

import BackButton from "@/components/BackButton";

import LineupContainer from "./components/LineupContainer";
import LineupMenu from "./components/LineupMenu";

import addPlayerAvailability from "./utils/addPlayerAvailability";

export async function loader({ params, request }) {
    const { eventId } = params;
    console.log("/events/:eventId > ", { eventId });

    return await getEventWithPlayerCharts({ eventId, request });
}

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "save-chart") {
        return savePlayerChart({ eventId, values });
    }
}

function Lineup({ loaderData }) {
    console.log("/events/:eventId/lineup > ", { ...loaderData });

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const {
        // game,
        // deferredData,
        managerIds,
        players,
        attendance,
        // season,
        // teams,
        ...rest
    } = loaderData;

    const managerView = managerIds.includes(currentUserId);

    const playersWithAvailability = addPlayerAvailability(attendance, players);

    const [lineupState, lineupHandlers] = useListState(rest.playerChart);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);

    // Players not yet in the lineup - available for adding
    const playersNotInLineup = playersWithAvailability?.filter((p) => {
        const isInLineup = lineupState?.some((lp) => lp.$id === p.$id);
        return !isInLineup;
    });

    return (
        <Container p="md">
            <Group justify="space-between" align="center" mt="lg" mb="xl">
                <BackButton text="Back to event details" />
                {managerView && (
                    <LineupMenu
                        game={rest.game}
                        playersNotInLineup={playersNotInLineup}
                        lineupState={lineupState}
                        lineupHandlers={lineupHandlers}
                        setHasBeenEdited={setHasBeenEdited}
                    />
                )}
            </Group>
            <LineupContainer
                managerView={managerView}
                players={playersWithAvailability}
                lineupState={lineupState}
                lineupHandlers={lineupHandlers}
                hasBeenEdited={hasBeenEdited}
                setHasBeenEdited={setHasBeenEdited}
                {...rest}
            />
        </Container>
    );
}

export default Lineup;
