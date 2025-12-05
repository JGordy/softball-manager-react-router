import { useState } from "react";

import { Container, Group } from "@mantine/core";
import { useListState } from "@mantine/hooks";

import { useOutletContext, useParams } from "react-router";

import { getEventWithPlayerCharts } from "@/loaders/games";

import { savePlayerChart } from "@/actions/lineups";

import BackButton from "@/components/BackButton";

import LineupContainer from "./components/LineupContainer";
import LineupMenu from "@/components/Lineup/LineupMenu";
import LineupValidationMenu from "@/components/Lineup/LineupValidationMenu";

import addPlayerAvailability from "./utils/addPlayerAvailability";
import { validateLineup } from "@/components/Lineup/utils/validateLineup";

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
    const { eventId } = useParams();
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

    const playersNotInLineup = playersWithAvailability?.filter((p) => {
        const isInLineup = lineupState?.some((lp) => lp.$id === p.$id);
        return !isInLineup;
    });

    const validationResults = validateLineup(lineupState, rest.game?.team);

    return (
        <Container p="md">
            <Group justify="space-between" align="center" mt="lg" mb="xl">
                <BackButton text="Back to event details" />
                {managerView && (
                    <Group gap="lg">
                        <LineupValidationMenu
                            validationResults={validationResults}
                        />
                        <LineupMenu
                            game={rest.game}
                            actionUrl={`/events/${eventId}/lineup`}
                            playersNotInLineup={playersNotInLineup}
                            lineupState={lineupState}
                            lineupHandlers={lineupHandlers}
                            setHasBeenEdited={setHasBeenEdited}
                        />
                    </Group>
                )}
            </Group>
            <LineupContainer
                managerView={managerView}
                players={playersWithAvailability}
                lineupState={lineupState}
                lineupHandlers={lineupHandlers}
                hasBeenEdited={hasBeenEdited}
                setHasBeenEdited={setHasBeenEdited}
                validationResults={validationResults}
                {...rest}
            />
        </Container>
    );
}

export default Lineup;
