import {
    useLoaderData,
    useOutletContext,
    useActionData,
    Link,
} from "react-router";
import { Container, Title, Text, Box, Button } from "@mantine/core";

import BackButton from "@/components/BackButton";
import DeferredLoader from "@/components/DeferredLoader";

import { getEventById } from "@/loaders/games";

import { updateGame } from "@/actions/games";

import {
    logGameEvent,
    undoGameEvent,
    updateGameEvent,
} from "@/actions/gameLogs";
import { savePlayerChart } from "@/actions/lineups";

import { useResponseNotification } from "@/utils/showNotification";
import { appwriteClientContext } from "@/contexts/router";

import GamedayContainer from "./components/GamedayContainer";
import GamedayLoadingSkeleton from "./components/GamedayLoadingSkeleton";
import { parsePlayerChart } from "./utils/gamedayUtils";

export function meta({ data, loaderData }) {
    const routeData = loaderData || data;
    if (!routeData || !routeData.game) return [];
    const { game, teams } = routeData;
    const team = teams?.[0] || {};
    const teamName = team.name || "Our Team";
    const opponentName = game.opponent || "Opponent";
    const gameDateFormatted = game.gameDate
        ? new Date(game.gameDate).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
          })
        : "";

    const title = `Live Gameday: ${teamName} vs ${opponentName} | RostrHQ`;
    const description = `Follow live scoring, play-by-play, and lineups for ${teamName} vs ${opponentName} on ${gameDateFormatted || "game day"}.`;

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: "/android-chrome-icon-512x512.png" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "/android-chrome-icon-512x512.png" },
    ];
}

export async function loader({ request, params, context }) {
    const { eventId } = params;
    const { isBotUserAgent } = await import("@/utils/device");
    const isBot = isBotUserAgent(request);

    let client = context.get(appwriteClientContext);
    if ((isBot || !client) && eventId) {
        const { createAdminClient } = await import("@/utils/appwrite/server");
        client = createAdminClient();
    }

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

export async function action({ request, params, context }) {
    const { eventId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    const client = context.get(appwriteClientContext);

    if (_action === "log-game-event") {
        const { baseState, ...logData } = values;
        let parsedBaseState = null;
        if (baseState) {
            try {
                parsedBaseState = JSON.parse(baseState);
            } catch (_e) {
                return {
                    success: false,
                    status: 400,
                    message: "Invalid baseState JSON structure",
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
        if (undoResponse?.success && values.playerChart) {
            const parsedPlayerChart = parsePlayerChart(values.playerChart);
            if (parsedPlayerChart === undefined) {
                console.warn(
                    "Invalid player chart data provided when undoing game event. Undo succeeded; lineup was not reverted.",
                );
                return {
                    ...undoResponse,
                    warning:
                        "Undo succeeded, but lineup chart was not reverted due to invalid player chart data.",
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
                    success: false,
                    status: 500,
                    message: "Log undone, but failed to revert lineup chart.",
                    details: error.message,
                };
            }
        }

        // If the log was successfully removed and it contains opponent lineup revert data
        if (undoResponse?.success && undoResponse.log?.baseState) {
            try {
                const parsedBaseState = JSON.parse(undoResponse.log.baseState);
                if (parsedBaseState.revertOpponentLineupLocked !== undefined) {
                    await updateGame({
                        values: {
                            opponentLineupLocked:
                                parsedBaseState.revertOpponentLineupLocked,
                            opponentLineup:
                                parsedBaseState.revertOpponentLineup,
                        },
                        eventId,
                        client,
                    });
                }
            } catch (e) {
                console.error(
                    "Failed to parse baseState for undoing opponent lineup:",
                    e,
                );
            }
        }

        return undoResponse;
    }
    if (_action === "lock-opponent-lineup") {
        const {
            opponentLineupLocked,
            opponentLineup,
            oldOpponentLineup,
            teamId,
            inning,
            halfInning,
        } = values;

        // Log the event
        const logResponse = await logGameEvent({
            gameId: eventId,
            client,
            teamId,
            inning,
            halfInning,
            eventType: "opponent_lineup_wrap",
            description: "Lineup locked and wrapped to top of order",
            rbi: 0,
            outsOnPlay: 0,
            baseState: JSON.stringify({
                revertOpponentLineupLocked: false,
                revertOpponentLineup: oldOpponentLineup,
            }),
        });

        if (logResponse && !logResponse.success) {
            return logResponse;
        }

        // Update the game
        return updateGame({
            values: { opponentLineupLocked, opponentLineup },
            eventId,
            client,
        });
    }
    if (_action === "update-game-event") {
        const { logId, propagate, ...logData } = values;
        return await updateGameEvent({
            logId,
            newData: logData,
            client,
            propagate: propagate === "true",
        });
    }
    if (_action === "update-game-score") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "update-opponent-settings") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "end-game") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "generate-recap") {
        const { generateGameRecapBackground } = await import(
            "@/actions/recap.js"
        );
        try {
            await generateGameRecapBackground({ eventId, client });
            return { success: true, message: "Recap generated successfully!" };
        } catch (error) {
            console.error("Failed to generate game recap:", error);
            return {
                success: false,
                error: true,
                message:
                    "Failed to generate recap column. Please check server logs.",
            };
        }
    }
    if (_action === "resume-game") {
        return updateGame({ values, eventId, client });
    }
    if (_action === "substitute-player") {
        const { playerChart, baseState, ...logData } = values;

        let parsedBaseState = null;
        if (baseState) {
            try {
                parsedBaseState = JSON.parse(baseState);
            } catch (_e) {
                return {
                    success: false,
                    status: 400,
                    message: "Invalid baseState JSON structure",
                };
            }
        }

        // Log the substitution event first
        const logResponse = await logGameEvent({
            gameId: eventId,
            client,
            ...logData,
            baseState: parsedBaseState,
        });

        // If logging fails, do not persist the chart update
        if (logResponse && !logResponse.success) {
            return logResponse;
        }

        // logResponse shape is { success, log: { $id, ... } }
        const logId = logResponse.log?.$id;

        const parsedPlayerChart = parsePlayerChart(playerChart);
        if (parsedPlayerChart === undefined) {
            // Rollback if parse fails
            if (logId) {
                const rollback = await undoGameEvent({ logId, client });
                if (rollback && !rollback.success) {
                    console.error(
                        "Critical: Substitution parsing rollback failed!",
                        rollback.message || rollback.error,
                    );
                }
            }
            return {
                success: false,
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
                if (rollback && !rollback.success) {
                    console.error(
                        "Critical: Substitution rollback failed!",
                        rollback.message || rollback.error,
                    );
                }
            }

            return {
                success: false,
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
                success: false,
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
                success: false,
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
    const loaderData = useLoaderData();
    const { user, isDesktop, isAuthenticated } = useOutletContext();
    const actionData = useActionData();

    useResponseNotification(actionData);

    if (isAuthenticated === false) {
        return (
            <Container size="sm" py="xl" ta="center">
                <Title order={2} mb="md">
                    Private Live Scoring Page
                </Title>
                <Text size="lg" c="dimmed" mb="xl">
                    You must be logged in to view live scoring for this game.
                </Text>
                <Button
                    component={Link}
                    to="/login"
                    variant="filled"
                    color="lime"
                >
                    Log In
                </Button>
            </Container>
        );
    }

    if (!loaderData || loaderData.gameDeleted || !loaderData.game) {
        return (
            <Container size="sm" py="xl">
                <Box mb="xl">
                    <BackButton />
                </Box>
                <Box ta="center" py="xl">
                    <Title order={2} mb="md">
                        Game Not Found
                    </Title>
                    <Text size="lg" c="dimmed">
                        This game has been removed or is no longer available.
                    </Text>
                </Box>
            </Container>
        );
    }

    const { game, deferredData, teams, scorekeeperIds } = loaderData;
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
                {({ logs, players, achievements }) => (
                    <GamedayContainer
                        game={game}
                        playerChart={game.playerChart || []}
                        team={team}
                        initialLogs={logs}
                        gameFinal={game.gameFinal}
                        isScorekeeper={isScorekeeper}
                        isDesktop={isDesktop}
                        user={user}
                        players={players || []}
                        achievements={achievements || []}
                    />
                )}
            </DeferredLoader>
        </Container>
    );
}
