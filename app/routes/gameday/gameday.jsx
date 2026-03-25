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
import { parsePlayerChart } from "./utils/gamedayUtils";

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
        let parsedBaseState = null;
        if (baseState) {
            try {
                parsedBaseState = JSON.parse(baseState);
            } catch (e) {
                return {
                    success: false,
                    error: "Invalid baseState JSON structure",
                };
            }
        }
        return await logGameEvent({
            gameId: eventId,
            client,
            ...logData,
            baseState: parsedBaseState,
        });
    }
    if (_action === "undo-game-event") {
        // Log the undo event deletion first
        const undoResponse = await undoGameEvent({
            logId: values.logId,
            client,
        });

        // If the log was successfully removed and a reverting playerChart is provided, apply it to the database
        if (undoResponse && !undoResponse.error && values.playerChart) {
            const parsedPlayerChart = parsePlayerChart(values.playerChart);
            if (parsedPlayerChart === undefined) {
                return {
                    error: true,
                    status: 400,
                    message:
                        "Invalid player chart data provided when undoing game event.",
                };
            }
            try {
                await savePlayerChart({
                    values: { playerChart: parsedPlayerChart },
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

        // logResponse shape is { success, log: { $id, ... } }
        const logId = logResponse.log?.$id;

        const parsedPlayerChart = parsePlayerChart(playerChart);
        if (parsedPlayerChart === undefined) {
            // Rollback if parse fails
            if (logId) {
                const rollback = await undoGameEvent({ logId, client });
                if (rollback && rollback.error) {
                    console.error(
                        "Critical: Substitution parsing rollback failed!",
                        rollback.error,
                    );
                }
            }
            return {
                error: true,
                status: 400,
                message:
                    "Invalid player chart JSON format provided during substitution.",
            };
        }

        try {
            // Apply lineup chart change; failures will throw and be handled in the catch block
            await savePlayerChart({
                values: { playerChart: parsedPlayerChart },
                eventId,
                client,
            });
        } catch (error) {
            console.error(
                "Failed to save player chart during substitution:",
                error,
            );
            // Manual rollback of the log event if savePlayerChart threw an exception
            if (logId) {
                const rollback = await undoGameEvent({ logId, client });
                if (rollback && rollback.error) {
                    console.error(
                        "Critical: Substitution rollback failed!",
                        rollback.error,
                    );
                }
            }

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
        const parsedPlayerChart = parsePlayerChart(values.playerChart);
        if (parsedPlayerChart === undefined) {
            return {
                error: true,
                status: 400,
                message: "Invalid player chart JSON format provided.",
            };
        }

        try {
            return await savePlayerChart({
                values: { playerChart: parsedPlayerChart },
                eventId,
                client,
            });
        } catch (error) {
            return {
                error: true,
                status: 500,
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
