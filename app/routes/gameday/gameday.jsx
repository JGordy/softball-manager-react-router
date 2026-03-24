import { useLoaderData, useOutletContext, useActionData } from "react-router";
import { Container } from "@mantine/core";

import DeferredLoader from "@/components/DeferredLoader";

import { getEventById } from "@/loaders/games";

import { updateGame } from "@/actions/games";

import { logGameEvent, undoGameEvent } from "@/actions/gameLogs";
import { savePlayerChart } from "@/actions/lineups";

import { useResponseNotification } from "@/utils/showNotification";

import { createSessionClient } from "@/utils/appwrite/server";

import GamedayContainer from "./components/GamedayContainer";
import GamedayLoadingSkeleton from "./components/GamedayLoadingSkeleton";

export async function loader({ params, request }) {
    const { eventId } = params;
    const client = await createSessionClient(request);
    return await getEventById({
        eventId,
        client,
        includeWeather: false,
        includeAttendance: false,
        includeAwards: false,
        includeVotes: false,
        includePark: false,
    });
}

export async function action({ request, params }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    const client = await createSessionClient(request);

    if (_action === "log-game-event") {
        const { baseState, ...logData } = values;
        return await logGameEvent({
            gameId: eventId,
            client,
            ...logData,
            baseState: baseState ? JSON.parse(baseState) : null,
        });
    }
    if (_action === "undo-game-event") {
        if (values.playerChart) {
            await savePlayerChart({
                values: { playerChart: JSON.parse(values.playerChart) },
                eventId,
                client,
            });
        }
        return await undoGameEvent({ logId: values.logId, client });
    }
    if (_action === "update-game-score") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "end-game") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "resume-game") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "substitute-player") {
        const { playerChart, baseState, ...logData } = values;

        await savePlayerChart({
            values: { playerChart: JSON.parse(playerChart) },
            eventId,
            client,
        });

        return await logGameEvent({
            gameId: eventId,
            client,
            ...logData,
            baseState: baseState ? JSON.parse(baseState) : null,
        });
    }
    if (_action === "save-player-chart") {
        return await savePlayerChart({
            values: { playerChart: JSON.parse(values.playerChart) },
            eventId,
            client,
        });
    }
    return null;
}

export default function Gameday() {
    const { game, deferredData, teams, scorekeeperIds } = useLoaderData();
    const { user, isDesktop } = useOutletContext();
    const actionData = useActionData();

    useResponseNotification(actionData);

    const team = teams?.[0];
    const isScorekeeper = !!(
        user &&
        scorekeeperIds &&
        scorekeeperIds.includes(user.$id)
    );

    return (
        <Container size="xl" py="xl">
            <DeferredLoader
                resolve={deferredData}
                fallback={<GamedayLoadingSkeleton isDesktop={isDesktop} />}
            >
                {({ logs, players }) => (
                    <GamedayContainer
                        game={game}
                        playerChart={game.playerChart || []}
                        team={team}
                        initialLogs={logs}
                        gameFinal={game.gameFinal}
                        isScorekeeper={isScorekeeper}
                        isDesktop={isDesktop}
                        players={players || []}
                    />
                )}
            </DeferredLoader>
        </Container>
    );
}
