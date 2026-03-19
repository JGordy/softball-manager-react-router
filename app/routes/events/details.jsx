import { useEffect, useRef } from "react";

import {
    Form,
    useNavigate,
    useNavigation,
    useOutletContext,
} from "react-router";

import { Box, Button, Container, Group, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import BackButton from "@/components/BackButton";
import DrawerContainer from "@/components/DrawerContainer";

import { deleteGame, updateGame } from "@/actions/games";
import { updatePlayerAttendance } from "@/actions/attendance";
import { sendAwardVotes } from "@/actions/awards";

import { getEventById } from "@/loaders/games";

import { getGameDayStatus } from "@/utils/dateTime";

import useModal from "@/hooks/useModal";

import GameMenu from "./components/GameMenu";
import Scoreboard from "./components/Scoreboard";
import MobileEventDetailsView from "./components/MobileEventDetailsView";
import DesktopEventDetailsView from "./components/DesktopEventDetailsView";

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "update-game") {
        return updateGame({ eventId, values });
    }
    if (_action === "delete-game") {
        return deleteGame({ eventId, values, request });
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

    // Check if game was deleted
    if (loaderData?.gameDeleted) {
        return (
            <Container size="sm" py="xl">
                <BackButton mb="xl" />
                <Box ta="center" py="xl">
                    <Title order={2} mb="md">
                        Game Not Found
                    </Title>
                    <Text size="lg" c="dimmed">
                        This game has been removed and is no longer available.
                    </Text>
                </Box>
            </Container>
        );
    }

    const [deleteDrawerOpened, deleteDrawerHandlers] = useDisclosure(false);

    const navigation = useNavigation();
    const navigate = useNavigate();
    const { closeAllModals } = useModal();

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    // During @media print the browser treats the viewport as narrow, so Mantine's
    // visibleFrom="lg" desktop container gets display:none. Force it visible for print.
    useEffect(() => {
        const show = () => {
            const el = document.querySelector("[data-desktop-view]");
            if (el) el.style.setProperty("display", "block", "important");
        };
        const restore = () => {
            const el = document.querySelector("[data-desktop-view]");
            if (el) el.style.removeProperty("display");
        };
        window.addEventListener("beforeprint", show);
        window.addEventListener("afterprint", restore);
        return () => {
            window.removeEventListener("beforeprint", show);
            window.removeEventListener("afterprint", restore);
        };
    }, []);

    const isDeleting =
        navigation.state === "submitting" &&
        navigation.formData?.get("_action") === "delete-game";

    // Close drawer immediately when delete starts
    useEffect(() => {
        if (isDeleting) {
            deleteDrawerHandlers.close();
        }
    }, [isDeleting, deleteDrawerHandlers]);

    const {
        game,
        deferredData,
        managerIds,
        scorekeeperIds,
        season,
        teams,
        weatherPromise,
    } = loaderData;

    const team = teams?.[0];
    const managerView = managerIds.includes(currentUserId);
    const isScorekeeper = scorekeeperIds.includes(currentUserId);

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

                // If game was deleted, navigate back
                if (actionData.deleted) {
                    navigate(-1);
                }
            } else if (!actionData) {
                // reset when there's no action data so future actions can run
                handledActionRef.current = false;
            } else if (actionData instanceof Error) {
                console.error("Error parsing action data:", actionData);
            }
        } catch (jsonError) {
            console.error("Error handling actionData:", jsonError);
        }
    }, [actionData, closeAllModals, navigate]);

    const sharedViewProps = {
        game,
        deferredData,
        season,
        team,
        user,
        weatherPromise,
        gameInProgress,
        gameIsPast,
        isScorekeeper,
        managerView,
        playerChart,
        // for the desktop header row
        result,
        openDeleteDrawer: deleteDrawerHandlers.open,
    };

    return (
        <>
            {/* Hero with stadium background — mobile only */}
            <Box
                className="event-details-hero"
                pt="xl"
                pb="100px"
                hiddenFrom="lg"
            >
                <Group justify="space-between" mx="md">
                    <BackButton />
                    {managerView && (
                        <GameMenu
                            game={game}
                            gameIsPast={gameIsPast}
                            openDeleteDrawer={deleteDrawerHandlers.open}
                            result={result}
                            season={season}
                            team={team}
                        />
                    )}
                </Group>
                {game.eventType !== "practice" ? (
                    <Scoreboard
                        game={game}
                        gameIsPast={gameIsPast}
                        gameInProgress={gameInProgress}
                        team={team}
                    />
                ) : (
                    <Title order={1} ta="center" c="white" mt="xl">
                        Practice
                    </Title>
                )}
            </Box>

            <Box hiddenFrom="lg">
                <MobileEventDetailsView {...sharedViewProps} />
            </Box>
            <Box visibleFrom="lg" data-desktop-view="true">
                <DesktopEventDetailsView {...sharedViewProps} />
            </Box>

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
