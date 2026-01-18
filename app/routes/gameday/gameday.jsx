import { useLoaderData, useOutletContext, useActionData } from "react-router";
import { Container, Title, Group } from "@mantine/core";

import BackButton from "@/components/BackButton";
import DeferredLoader from "@/components/DeferredLoader";

import { getEventById } from "@/loaders/games";

import { updateGame } from "@/actions/games";

import { logGameEvent, undoGameEvent } from "@/actions/gameLogs";

import { useResponseNotification } from "@/utils/showNotification";

import GamedayContainer from "./components/GamedayContainer";
import GamedayLoadingSkeleton from "./components/GamedayLoadingSkeleton";
import GamedayMenu from "./components/GamedayMenu";

export async function loader({ params, request }) {
    const { eventId } = params;
    return await getEventById({
        eventId,
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

    if (_action === "log-game-event") {
        const { baseState, ...logData } = values;
        return await logGameEvent({
            gameId: eventId,
            ...logData,
            baseState: baseState ? JSON.parse(baseState) : null,
        });
    }
    if (_action === "undo-game-event") {
        return await undoGameEvent({ logId: values.logId });
    }
    if (_action === "update-game-score") {
        return updateGame({ values, eventId });
    }
    if (_action === "end-game") {
        return updateGame({ values, eventId });
    }
    if (_action === "resume-game") {
        return updateGame({ values, eventId });
    }
    return null;
}

export default function Gameday() {
    const { game, deferredData, teams, managerIds } = useLoaderData();
    const { user } = useOutletContext();
    const actionData = useActionData();

    useResponseNotification(actionData);

    const team = teams?.[0];
    const isManager = !!(user && managerIds && managerIds.includes(user.$id));

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" align="center" mb="xl">
                <BackButton to={`/events/${game.$id}`} />
                <Title order={3}>Scoring & Stats</Title>
                {isManager && <GamedayMenu gameFinal={game.gameFinal} />}
            </Group>

            <DeferredLoader
                resolve={deferredData}
                fallback={<GamedayLoadingSkeleton />}
            >
                {({ logs }) => (
                    <GamedayContainer
                        game={game}
                        playerChart={game.playerChart || []}
                        team={team}
                        initialLogs={logs}
                        gameFinal={game.gameFinal}
                        isManager={isManager}
                    />
                )}
            </DeferredLoader>
        </Container>
    );
}
