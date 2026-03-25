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
        const undoResponse = await undoGameEvent({
            logId: values.logId,
            client,
        });

        // Only update player chart if the undo successfully removed the log
        if (undoResponse && !undoResponse.error && values.playerChart) {
            try {
                await savePlayerChart({
                    values: { playerChart: JSON.parse(values.playerChart) },
                    eventId,
                    client,
                });
            } catch (error) {
                console.error(
                    "Failed to update player chart after undo:",
                    error,
                );
                return {
                    error: true,
                    status: error instanceof SyntaxError ? 400 : 500,
                    message: "Log undone, but failed to revert lineup chart.",
                    details: error.message,
                };
            }
        }

        return undoResponse;
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

        // Log the substitution event first
        const logResponse = await logGameEvent({
            gameId: eventId,
            client,
            ...logData,
            baseState: baseState ? JSON.parse(baseState) : null,
        });

        // If logging fails, do not persist the chart update
        if (logResponse && logResponse.error) {
            return logResponse;
        }

        const logId = logResponse.$id;

        try {
            // Apply lineup chart change
            const chartResponse = await savePlayerChart({
                values: { playerChart: JSON.parse(playerChart) },
                eventId,
                client,
            });

            if (chartResponse && chartResponse.error) {
                // Manual rollback of the log event if the chart save returned an error object
                if (logId) await undoGameEvent({ logId, client });
                return chartResponse;
            }
        } catch (error) {
            console.error(
                "Failed to save player chart during substitution:",
                error,
            );
            // Manual rollback of the log event if savePlayerChart threw an exception
            if (logId) await undoGameEvent({ logId, client });

            return {
                error: true,
                status: error instanceof SyntaxError ? 400 : 500,
                message:
                    "Substitution log created, but lineup update failed. Rolled back log.",
                details: error.message,
            };
        }

        return logResponse;
    }

    if (_action === "save-player-chart") {
        try {
            return await savePlayerChart({
                values: { playerChart: JSON.parse(values.playerChart) },
                eventId,
                client,
            });
        } catch (error) {
            return {
                error: true,
                status: error instanceof SyntaxError ? 400 : 500,
                message: "Failed to save player chart.",
                details: error.message,
            };
        }
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
