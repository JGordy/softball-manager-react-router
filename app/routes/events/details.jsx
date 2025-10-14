import { useEffect, useRef } from "react";

import { Form, useNavigation, useOutletContext } from "react-router";

import { Box, Button, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import BackButton from "@/components/BackButton";
import DrawerContainer from "@/components/DrawerContainer";

import {
    createAttendanceForm,
    deleteGame,
    savePlayerChart,
    updateGame,
} from "@/actions/games";
import { updatePlayerAttendance } from "@/actions/attendance";
import { sendAwardVotes } from "@/actions/awards";

import { getEventById } from "@/loaders/games";

import { getGameDayStatus } from "@/utils/dateTime";

import useModal from "@/hooks/useModal";

import AwardsContainer from "./components/AwardsContainer";
import DetailsCard from "./components/DetailsCard";
import GameMenu from "./components/GameMenu";
import RosterDetails from "./components/RosterDetails";
import Scoreboard from "./components/Scoreboard";
import WeatherCard from "./components/WeatherCard";

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "update-game") {
        return updateGame({ eventId, values });
    }
    if (_action === "create-attendance") {
        return createAttendanceForm({ eventId, values, request });
    }
    if (_action === "save-chart") {
        return savePlayerChart({ eventId, values });
    }
    if (_action === "delete-game") {
        return deleteGame({ eventId, values });
    }
    if (_action === "update-attendance") {
        return updatePlayerAttendance({ eventId, values });
    }
    if (_action === "send-votes") {
        return sendAwardVotes({ eventId, values });
    }
}

export async function loader({ params, request }) {
    const { eventId } = params;

    return await getEventById({ eventId, request });
}

export default function EventDetails({ loaderData, actionData }) {
    // console.log("/events/:eventId > ", loaderData);

    const [deleteDrawerOpened, deleteDrawerHandlers] = useDisclosure(false);

    const navigation = useNavigation();
    const { closeAllModals } = useModal();

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const isDeleting =
        navigation.state === "submitting" &&
        navigation.formData?.get("_action") === "delete-game";

    const { game, deferredData, managerIds, season, teams, weatherPromise } =
        loaderData;

    const team = teams?.[0];
    const managerView = managerIds.includes(currentUserId);

    const { gameDate, playerChart, result } = game;

    const gameDayStatus = getGameDayStatus(gameDate, true);
    const gameInProgress = gameDayStatus === "in progress";
    const gameIsPast = gameDayStatus === "past";

    // Run this effect only when actionData changes. Guard so we only
    // call closeAllModals once for a successful action to avoid a
    // potential loop if closing modals triggers parent state changes.
    const handledActionRef = useRef(false);

    useEffect(() => {
        try {
            if (actionData?.success && !handledActionRef.current) {
                handledActionRef.current = true;
                closeAllModals();
            } else if (!actionData) {
                // reset when there's no action data so future actions can run
                handledActionRef.current = false;
            } else if (actionData instanceof Error) {
                console.error("Error parsing action data:", actionData);
            }
        } catch (jsonError) {
            console.error("Error handling actionData:", jsonError);
        }
    }, [actionData, closeAllModals]);

    return (
        <>
            <Box className="event-details-hero" pt="xl" pb="100px">
                <Group justify="space-between" mx="md">
                    <BackButton text="Back to Events" />
                    {managerView && (
                        <GameMenu
                            game={game}
                            gameIsPast={gameIsPast}
                            openDeleteDrawer={deleteDrawerHandlers.open}
                            result={result}
                            team={team}
                        />
                    )}
                </Group>

                <Scoreboard
                    game={game}
                    gameIsPast={gameIsPast}
                    gameInProgress={gameInProgress}
                    team={team}
                />
            </Box>

            <DetailsCard
                game={game}
                deferredData={deferredData}
                season={season}
                team={team}
            />

            {gameIsPast ? (
                <AwardsContainer
                    game={game}
                    team={team}
                    user={user}
                    deferredData={deferredData}
                />
            ) : (
                <WeatherCard
                    gameDate={gameDate}
                    weatherPromise={weatherPromise}
                />
            )}

            <RosterDetails
                deferredData={deferredData}
                game={game}
                managerView={managerView}
                playerChart={playerChart}
                team={team}
            />

            {managerView && (
                <DrawerContainer
                    opened={deleteDrawerOpened}
                    onClose={deleteDrawerHandlers.close}
                    title="Delete Game"
                >
                    <Text>
                        Are you sure you want to delete this game? There is no
                        undoing this action.
                    </Text>
                    <Form method="post">
                        <input
                            type="hidden"
                            name="_action"
                            value="delete-game"
                        />
                        <input
                            type="hidden"
                            name="userId"
                            value={currentUserId}
                        />
                        <Button
                            type="submit"
                            color="red"
                            variant="filled"
                            mt="lg"
                            fullWidth
                            loading={isDeleting}
                            disabled={isDeleting}
                        >
                            Yes, Delete this Game
                        </Button>
                    </Form>
                </DrawerContainer>
            )}
        </>
    );
}
