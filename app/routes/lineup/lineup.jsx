import { useState, useEffect } from "react";

import { Container, Group, Stack, Text, Title } from "@mantine/core";
import { useListState } from "@mantine/hooks";

import { useOutletContext, useParams } from "react-router";

import { getEventWithPlayerCharts } from "@/loaders/games";

import { savePlayerChart } from "@/actions/lineups";

import BackButton from "@/components/BackButton";

import LineupContainer from "./components/LineupContainer";
import LineupMenu from "./components/LineupMenu";
import LineupValidationMenu from "./components/LineupValidationMenu";

import addPlayerAvailability from "@/utils/addPlayerAvailability";
import { validateLineup } from "./utils/validateLineup";
import { formatForViewerDate } from "@/utils/dateTime";

export async function loader({ params, request }) {
    const { eventId } = params;
    // console.log("/events/:eventId > ", { eventId });
    return await getEventWithPlayerCharts({ eventId, request });
}

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "save-chart") {
        return savePlayerChart({ eventId, values });
    }

    if (_action === "finalize-chart") {
        // Finalize and send notifications to team members
        return savePlayerChart({ eventId, values, sendNotification: true });
    }
}

function Lineup({ loaderData, actionData }) {
    // console.log("/events/:eventId/lineup > ", { ...loaderData });

    const { user } = useOutletContext();
    const { eventId } = useParams();
    const currentUserId = user.$id;

    const {
        game,
        // deferredData,
        managerIds,
        players,
        attendance,
        teams,
        // season,
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

    useEffect(() => {
        if (
            actionData?.success &&
            actionData?.event &&
            Object.keys(actionData.event).length
        ) {
            trackEvent(actionData.event.name, actionData.event.data);
        }
    }, [actionData]);

    // Use the first team from the teams array
    const team = teams?.[0];

    const validationResults = validateLineup(lineupState, team);

    return (
        <Container size="xl" p="md">
            <Stack gap="md" mt="lg" mb="xl">
                <Group justify="space-between" align="center">
                    <BackButton text="Back to event details" />
                    {managerView && (
                        <Group gap="lg" visibleFrom="sm">
                            <LineupValidationMenu
                                validationResults={validationResults}
                            />
                            <LineupMenu
                                game={game}
                                team={team}
                                actionUrl={`/events/${eventId}/lineup`}
                                playersNotInLineup={playersNotInLineup}
                                players={playersWithAvailability}
                                lineupState={lineupState}
                                lineupHandlers={lineupHandlers}
                                setHasBeenEdited={setHasBeenEdited}
                            />
                        </Group>
                    )}
                    {managerView && (
                        <Group gap="xs" hiddenFrom="sm">
                            <LineupValidationMenu
                                validationResults={validationResults}
                            />
                            <LineupMenu
                                game={game}
                                team={team}
                                actionUrl={`/events/${eventId}/lineup`}
                                playersNotInLineup={playersNotInLineup}
                                players={playersWithAvailability}
                                lineupState={lineupState}
                                lineupHandlers={lineupHandlers}
                                setHasBeenEdited={setHasBeenEdited}
                            />
                        </Group>
                    )}
                </Group>

                <Stack gap={0}>
                    <Title order={4}>vs. {game?.opponent || "TBD"}</Title>
                    <Text size="sm" c="dimmed">
                        {formatForViewerDate(game?.gameDate)}
                    </Text>
                </Stack>
            </Stack>

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
