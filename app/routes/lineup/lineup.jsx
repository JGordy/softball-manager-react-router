import { useState, useEffect, useRef } from "react";
import { useOutletContext, useParams, Link } from "react-router";

import { Container, Group, Stack, Text, Title, Button } from "@mantine/core";
import { useListState, useDisclosure } from "@mantine/hooks";

import { IconDeviceAnalytics } from "@tabler/icons-react";

import { getEventById, getEventWithPlayerCharts } from "@/loaders/games";

import { savePlayerChart } from "@/actions/lineups";

import BackButton from "@/components/BackButton";

import { createSessionClient } from "@/utils/appwrite/server";

import addPlayerAvailability from "@/utils/addPlayerAvailability";

import { formatForViewerDate, getGameDayStatus } from "@/utils/dateTime";
import { parsePlayerChart } from "@/routes/gameday/utils/gamedayUtils";
import { createTemporaryPlayer } from "@/actions/users";
import { trackEvent } from "@/utils/analytics";
import { useResponseNotification } from "@/utils/showNotification";
import useModal from "@/hooks/useModal";

import LineupContainer from "./components/LineupContainer";
import LineupMenu from "./components/LineupMenu";
import LineupValidationMenu from "./components/LineupValidationMenu";
import AILineupDrawer from "./components/AILineupDrawer";
import AddPlayersDrawer from "./components/AddPlayersDrawer";

import { validateLineup } from "./utils/validateLineup";

export async function loader({ params, request }) {
    const { eventId } = params;
    const client = await createSessionClient(request);
    return await getEventWithPlayerCharts({ eventId, client });
}

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    const client = await createSessionClient(request);

    if (_action === "save-chart") {
        const playerChart = parsePlayerChart(values.playerChart);
        if (playerChart === undefined) {
            return {
                success: false,
                status: 400,
                message: "Invalid playerChart JSON format provided.",
            };
        }

        return await savePlayerChart({
            eventId,
            values: {
                ...values,
                playerChart,
            },
            client,
        });
    }

    if (_action === "finalize-chart") {
        // Finalize and send notifications to team members
        const playerChart = parsePlayerChart(values.playerChart);
        if (playerChart === undefined) {
            return {
                success: false,
                status: 400,
                message: "Invalid playerChart JSON format provided.",
            };
        }

        return await savePlayerChart({
            eventId,
            values: {
                ...values,
                playerChart,
            },
            client,
            sendNotification: true,
        });
    }

    if (_action === "create-guest-player") {
        const eventData = await getEventById({
            eventId,
            client,
            includePlayers: false,
            includeAttendance: false,
            includePark: false,
            includeAwards: false,
            includeVotes: false,
            includeLogs: false,
            includeWeather: false,
        });

        if (eventData.gameDeleted || !eventData.game) {
            return {
                success: false,
                status: 404,
                message: "This event has been deleted.",
            };
        }

        const teamId = eventData.teams?.[0]?.$id;
        if (!teamId) {
            return {
                success: false,
                status: 400,
                message: "Could not determine team for this event.",
            };
        }

        return await createTemporaryPlayer({
            values,
            teamId,
            eventId,
            client,
        });
    }
}

function Lineup({ loaderData, actionData }) {
    // console.log("/events/:eventId/lineup > ", { ...loaderData });

    const { user } = useOutletContext();
    const { eventId } = useParams();
    const currentUserId = user.$id;

    useResponseNotification(actionData);

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
    const [aiDrawerOpened, aiDrawerHandlers] = useDisclosure(false);
    const [addPlayersDrawerOpened, addPlayersHandlers] = useDisclosure(false);
    const lineupStateRef = useRef(null);
    const { closeAllModals } = useModal();
    const lastProcessedActionDataRef = useRef(null);

    // Keep a ref in sync so the AddPlayersDrawer onClose handler always reads
    // the latest lineupState without a stale closure.
    useEffect(() => {
        lineupStateRef.current = lineupState;
    });

    const playersNotInLineup = playersWithAvailability?.filter((p) => {
        const isInLineup = lineupState?.some((lp) => lp.$id === p.$id);
        return !isInLineup;
    });

    useEffect(() => {
        // Only process actionData if it's new and successful
        if (
            actionData?.success &&
            actionData !== lastProcessedActionDataRef.current
        ) {
            lastProcessedActionDataRef.current = actionData;

            // 1. Handle server-side events if present (save-chart, finalize-chart, etc.)
            if (actionData.event && Object.keys(actionData.event).length) {
                trackEvent(actionData.event.name, actionData.event.data);
            }

            // 2. Handle guest player creation (processed once)
            if (actionData.response?.player) {
                const newPlayer = actionData.response.player;

                lineupHandlers.append({
                    $id: newPlayer.$id,
                    firstName: newPlayer.firstName,
                    lastName: newPlayer.lastName,
                    gender: newPlayer.gender,
                    positions: [],
                });

                // eslint-disable-next-line react-hooks/set-state-in-effect
                setHasBeenEdited(true);
                closeAllModals();

                trackEvent("add_guest_player_success", {
                    eventId,
                    playerId: newPlayer.$id,
                });
            }
        }
    }, [actionData, eventId, lineupHandlers, closeAllModals]);

    // Use the first team from the teams array
    const team = teams?.[0];

    const validationResults = validateLineup(lineupState, team);
    const gameDayStatus = getGameDayStatus(game?.gameDate, true);
    const isGameActive =
        gameDayStatus === "in progress" || gameDayStatus === "today";

    return (
        <Container size="xl" p="md">
            <Stack gap="md" mt="lg" mb="xl">
                <Group justify="space-between" align="center">
                    <BackButton text="Back to event details" />
                    {managerView && (
                        <Group gap="lg" visibleFrom="sm">
                            {isGameActive && (
                                <Button
                                    variant="light"
                                    component={Link}
                                    to={`/events/${eventId}/gameday`}
                                    leftSection={
                                        <IconDeviceAnalytics size={16} />
                                    }
                                >
                                    Go to Live Scoring
                                </Button>
                            )}
                            <LineupValidationMenu
                                validationResults={validationResults}
                            />
                            <LineupMenu
                                game={game}
                                team={team}
                                actionUrl={`/events/${eventId}/lineup`}
                                players={playersWithAvailability}
                                lineupState={lineupState}
                                lineupHandlers={lineupHandlers}
                                setHasBeenEdited={setHasBeenEdited}
                                onOpenAiDrawer={aiDrawerHandlers.open}
                                onOpenAddPlayers={addPlayersHandlers.open}
                            />
                        </Group>
                    )}
                    {managerView && (
                        <Group gap="xs" hiddenFrom="sm">
                            {isGameActive && (
                                <Button
                                    variant="light"
                                    component={Link}
                                    to={`/events/${eventId}/gameday`}
                                    leftSection={
                                        <IconDeviceAnalytics size={16} />
                                    }
                                >
                                    Scoring
                                </Button>
                            )}
                            <LineupValidationMenu
                                validationResults={validationResults}
                            />
                            <LineupMenu
                                game={game}
                                team={team}
                                actionUrl={`/events/${eventId}/lineup`}
                                players={playersWithAvailability}
                                lineupState={lineupState}
                                lineupHandlers={lineupHandlers}
                                setHasBeenEdited={setHasBeenEdited}
                                onOpenAiDrawer={aiDrawerHandlers.open}
                                onOpenAddPlayers={addPlayersHandlers.open}
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
                game={game}
                teams={teams}
                managerView={managerView}
                players={playersWithAvailability}
                lineupState={lineupState}
                lineupHandlers={lineupHandlers}
                hasBeenEdited={hasBeenEdited}
                setHasBeenEdited={setHasBeenEdited}
                validationResults={validationResults}
                onOpenAiDrawer={aiDrawerHandlers.open}
                onOpenAddPlayers={addPlayersHandlers.open}
                {...rest}
            />

            <AILineupDrawer
                opened={aiDrawerOpened}
                onClose={aiDrawerHandlers.close}
                game={game}
                team={team}
                players={playersWithAvailability}
                lineupHandlers={lineupHandlers}
                setHasBeenEdited={setHasBeenEdited}
            />

            <AddPlayersDrawer
                opened={addPlayersDrawerOpened}
                onClose={() => {
                    addPlayersHandlers.close();
                    setTimeout(() => {
                        if (lineupStateRef.current?.length === 0) {
                            lineupHandlers.setState(null);
                        }
                    }, 0);
                }}
                playersNotInLineup={playersNotInLineup}
                lineupState={lineupState ?? []}
                lineupHandlers={lineupHandlers}
                setHasBeenEdited={setHasBeenEdited}
            />
        </Container>
    );
}

export default Lineup;
