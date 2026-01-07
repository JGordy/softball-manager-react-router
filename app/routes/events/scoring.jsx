import { useLoaderData, useOutletContext, useActionData } from "react-router";
import { Container, Title, Box, Group } from "@mantine/core";

import BackButton from "@/components/BackButton";
import DeferredLoader from "@/components/DeferredLoader";

import { getEventById } from "@/loaders/games";

import { updateGame } from "@/actions/games";

import { logGameEvent, undoGameEvent } from "@/actions/gameLogs";

import { useResponseNotification } from "@/utils/showNotification";

import ScoringContainer from "./components/scoring/ScoringContainer";
import ScoringLoadingSkeleton from "./components/scoring/ScoringLoadingSkeleton";
import ScoringMenu from "./components/scoring/ScoringMenu";

export async function loader({ params, request }) {
    const { eventId } = params;
    return await getEventById({ eventId, request });
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
        return updateGame({ values: { gameFinal: true }, eventId });
    }
    return null;
}

export default function GameScoring() {
    const { game, deferredData, teams, managerIds } = useLoaderData();
    const { user } = useOutletContext();
    const actionData = useActionData();

    useResponseNotification(actionData);

    const team = teams?.[0];
    const isManager = !!(user && managerIds && managerIds.includes(user.$id));

    if (!isManager) {
        return (
            <Container size="sm" py="xl">
                <BackButton mb="xl" />
                <Box ta="center" py="xl">
                    <Title order={2} mb="md">
                        Access Denied
                    </Title>
                    <p>Only team managers can score games.</p>
                </Box>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" align="center" mb="xl">
                <BackButton />
                <Title order={3}>Live Scoring</Title>
                <ScoringMenu gameFinal={game.gameFinal} />
            </Group>

            <DeferredLoader
                resolve={deferredData}
                fallback={<ScoringLoadingSkeleton />}
            >
                {({ logs }) => (
                    <ScoringContainer
                        game={game}
                        playerChart={game.playerChart || []}
                        team={team}
                        initialLogs={logs}
                        gameFinal={game.gameFinal}
                    />
                )}
            </DeferredLoader>
        </Container>
    );
}
