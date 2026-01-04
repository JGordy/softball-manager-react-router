import { useLoaderData, useOutletContext } from "react-router";
import { Container, Title, Box, Group, Skeleton } from "@mantine/core";

import BackButton from "@/components/BackButton";
import DeferredLoader from "@/components/DeferredLoader";

import { getEventById } from "@/loaders/games";

import { updateGame } from "@/actions/games";

import { logGameEvent, undoGameEvent } from "@/actions/gameLogs";

import ScoringContainer from "./components/scoring/ScoringContainer";

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
    return null;
}

export default function GameScoring() {
    const { game, deferredData, teams, managerIds } = useLoaderData();
    const { user } = useOutletContext();

    const team = teams?.[0];
    const isManager = managerIds.includes(user.$id);

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
            <Group justify="space-between" mb="xl">
                <BackButton />
                <Title order={3}>
                    Live Scoring: {game.opponent || "Opponent"}
                </Title>
            </Group>

            <DeferredLoader
                resolve={deferredData}
                fallback={<Skeleton height={500} radius="lg" />}
            >
                {({ logs }) => (
                    <ScoringContainer
                        game={game}
                        playerChart={game.playerChart}
                        team={team}
                        initialLogs={logs}
                    />
                )}
            </DeferredLoader>
        </Container>
    );
}
