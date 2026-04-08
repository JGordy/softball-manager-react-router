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

import { createSessionClient } from "@/utils/appwrite/server";

import { getGameDayStatus } from "@/utils/dateTime";

import useModal from "@/hooks/useModal";

import GameMenu from "./components/GameMenu";
import Scoreboard from "./components/Scoreboard";
import MobileEventDetailsView from "./components/MobileEventDetailsView";
import DesktopEventDetailsView from "./components/DesktopEventDetailsView";
import AvailabilityPromptDrawer from "./components/AvailabilityPromptDrawer";

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    const client = await createSessionClient(request);

    if (_action === "update-game") {
        return updateGame({ eventId, values, client });
    }
    if (_action === "delete-game") {
        return deleteGame({ eventId, client });
    }
    if (_action === "update-attendance") {
        return updatePlayerAttendance({ eventId, values, client });
    }
    if (_action === "send-votes") {
        return sendAwardVotes({ eventId, values, client });
    }
}

export async function loader({ params, request }) {
    const { eventId } = params;
    const client = await createSessionClient(request);

    return await getEventById({ eventId, client });
}

export default function EventDetails({ loaderData, actionData }) {
    // console.log("/events/:eventId > ", loaderData);

    const [deleteDrawerOpened, deleteDrawerHandlers] = useDisclosure(false);
    const [promptDrawerOpened, promptDrawerHandlers] = useDisclosure(false);

    const navigation = useNavigation();
    const navigate = useNavigate();
    const { closeAllModals } = useModal();

    const outletContext = useOutletContext();
    const user = outletContext?.user;
    const currentUserId = user?.$id;

    const hasPromptedRef = useRef(false);

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
        managerIds = [],
        scorekeeperIds = [],
        season,
        teams,
        weatherPromise,
    } = loaderData || {};

    // Automatically prompt for availability if user hasn't responded
    useEffect(() => {
        if (
            loaderData?.gameDeleted ||
            !deferredData?.attendance ||
            hasPromptedRef.current ||
            !currentUserId
        )
            return;

        deferredData.attendance.then((result) => {
            const attendance = result.rows || [];
            const userAttendance = attendance.find(
                (a) => a.userId === currentUserId,
            );
            if (!userAttendance || userAttendance.status === "unknown") {
                promptDrawerHandlers.open();
                hasPromptedRef.current = true;
            }
        });
    }, [
        deferredData?.attendance,
        currentUserId,
        promptDrawerHandlers,
        loaderData?.gameDeleted,
    ]);

    // Run this effect only when actionData changes. Guard so we only
    // call closeAllModals once for a successful action to avoid a
    // potential loop if closing modals triggers parent state changes.
    const handledActionRef = useRef(false);

    useEffect(() => {
        if (loaderData?.gameDeleted) return;

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
    }, [actionData, closeAllModals, navigate, loaderData?.gameDeleted]);

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

    const team = teams?.[0];
    const managerView = (managerIds || []).includes(currentUserId);
    const isScorekeeper = (scorekeeperIds || []).includes(currentUserId);

    const { gameDate, playerChart, result } = game || {};

    const gameDayStatus = getGameDayStatus(gameDate, true);
    const gameInProgress = gameDayStatus === "in progress";
    const gameIsPast = gameDayStatus === "past";

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

            <AvailabilityPromptDrawer
                opened={promptDrawerOpened}
                onClose={promptDrawerHandlers.close}
                game={game}
                player={user}
                teamId={team?.$id}
            />

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
