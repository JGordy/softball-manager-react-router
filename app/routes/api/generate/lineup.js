import { Query } from "node-appwrite";

import { createModel, generateContentStream } from "@/utils/ai";
import { listDocuments, updateDocument } from "@/utils/databases";
import { createAdminClient } from "@/utils/appwrite/server";
import { EVENT_TYPE_MAP, UI_KEYS } from "@/constants/scoring";
import { MAX_AI_GENERATIONS_PER_GAME } from "@/constants/ai";

import lineupSchema from "./utils/lineupSchema";
import { getLineupSystemInstruction } from "./utils/systemInstructions";

// Derive minified event codes from the shared scoring constants
const DB_TO_MINIFIED_EVENT = Object.entries(EVENT_TYPE_MAP).reduce(
    (acc, [uiKey, dbValue]) => {
        // Map verbose batted out descriptions to "OUT" for AI context
        const isVerboseOut = [
            UI_KEYS.GROUND_OUT,
            UI_KEYS.FLY_OUT,
            UI_KEYS.LINE_OUT,
            UI_KEYS.POP_OUT,
        ].includes(uiKey);

        acc[dbValue] = isVerboseOut ? "OUT" : uiKey;
        return acc;
    },
    {},
);

/**
 * Generate an optimal softball lineup based on historical performance data
 * POST /api/generate/lineup
 *
 * @param {Request} request - The request object containing player data, team info, and game details
 * @returns {Response} JSON response with the generated lineup or error
 */
export async function action({ request }) {
    let rollbackGameId = null;
    let rollbackCount = null;

    try {
        // Parse the request body to get players, team info, and game details
        const body = await request.json();
        const { players, team, gameId } = body;

        if (!players || !Array.isArray(players) || players.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "Invalid request: players array is required",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (!gameId) {
            return new Response(
                JSON.stringify({
                    error: "Invalid request: gameId is required",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Step 1: Get the game to find the teamId
        const game = await listDocuments("games", [
            Query.equal("$id", gameId),
        ]).then((response) => response.rows[0]);

        if (!game || !game.teamId) {
            return new Response(
                JSON.stringify({
                    error: "Game not found or missing teamId",
                }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Check validation limit
        const currentCount = game.aiGenerationCount || 0;
        if (currentCount >= MAX_AI_GENERATIONS_PER_GAME) {
            return new Response(
                JSON.stringify({
                    error: `AI generation limit reached for this game (max ${MAX_AI_GENERATIONS_PER_GAME}).`,
                }),
                {
                    status: 403,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Increment count
        // Note: Appwrite doesn't support atomic increments natively via updateDocument API yet without functions.
        // We accept a small race condition risk here for the generation limit behavior.
        await updateDocument("games", game.$id, {
            aiGenerationCount: currentCount + 1,
        });

        // Set rollback values in case of failure later in the process
        rollbackGameId = game.$id;
        rollbackCount = currentCount;

        const teamId = game.teamId;

        const { teams } = createAdminClient();
        let maxMaleBatters = 0;
        try {
            const prefs = await teams.getPrefs(teamId);
            maxMaleBatters = parseInt(prefs.maxMaleBatters, 10) || 0;
        } catch (e) {
            // failed to load prefs or no prefs set, stick to defaults
        }

        // Step 2: Get recent games for this team (rolling history)
        // Fetch up to 20 to ensure we find 10 valid ones with lineups
        const teamGames = await listDocuments("games", [
            Query.equal("teamId", teamId),
            Query.isNotNull("result"),
            Query.orderDesc("gameDate"),
            Query.limit(20),
        ]);

        // Client-side sort to be safe on date format
        const sortedGames = [...teamGames.rows].sort((a, b) => {
            const dateA = new Date(a.gameDate || a.dateTime);
            const dateB = new Date(b.gameDate || b.dateTime);
            return dateB - dateA;
        });

        // Use ONLY the top 10 valid games for both stats AND history context
        // This ensures the AI prompt doesn't grow indefinitely across seasons
        const potentialGames = sortedGames.filter(
            (g) => g.result && g.playerChart,
        );
        const recentGames = potentialGames.slice(0, 10);
        const recentGameIds = recentGames.map((g) => g.$id);

        // Fetch logs for these games
        const gameStats = {};
        if (recentGameIds.length > 0) {
            try {
                const logs = await listDocuments("game_logs", [
                    Query.equal("gameId", recentGameIds),
                    Query.limit(2000), // Ensure we get enough logs
                    Query.select([
                        "gameId",
                        "playerId",
                        "eventType",
                        "description",
                        "rbi",
                    ]),
                ]);

                logs.rows.forEach((log) => {
                    const eventCode = DB_TO_MINIFIED_EVENT[log.eventType];
                    if (eventCode) {
                        if (!gameStats[log.gameId]) {
                            gameStats[log.gameId] = {};
                        }
                        if (!gameStats[log.gameId][log.playerId]) {
                            gameStats[log.gameId][log.playerId] = [];
                        }

                        // Append description if available for context (e.g., location, power)
                        let statEntry = eventCode;

                        // Collect extra details
                        const details = [];
                        if (log.description) details.push(log.description);
                        if (log.rbi) details.push(`RBI:${log.rbi}`);

                        if (details.length > 0) {
                            statEntry += `(${details.join(", ")})`;
                        }

                        gameStats[log.gameId][log.playerId].push(statEntry);
                    }
                });
            } catch (error) {
                const isDevelopment = process.env.NODE_ENV === "development";

                console.error(
                    "Failed to fetch/process game logs for stats:",
                    isDevelopment ? error : "",
                );
                // Fail silently, gameStats remains empty/partial
            }
        }

        // Step 3: Gather lineup and result data for each game
        // Filter and validate games with proper error handling
        const historicalData = recentGames.reduce((acc, g) => {
            // Skip games without required data early
            if (!g.result || !g.playerChart) {
                return acc;
            }

            let playerChart = [];

            try {
                // Handle double-stringified JSON (Appwrite sometimes does this)
                let parsed =
                    typeof g.playerChart === "string"
                        ? JSON.parse(g.playerChart)
                        : g.playerChart;

                // If it's still a string after first parse, parse again
                if (typeof parsed === "string") {
                    parsed = JSON.parse(parsed);
                }

                playerChart = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                const isDev =
                    process.env && process.env.NODE_ENV === "development";
                const rawMessage =
                    e && typeof e.message === "string" ? e.message : String(e);
                const safeMessage =
                    typeof rawMessage === "string" && rawMessage.length > 200
                        ? rawMessage.slice(0, 200) + "..."
                        : rawMessage;

                if (isDev) {
                    // In development, log full error object for easier debugging
                    console.error(
                        `Error parsing playerChart for game ${g.$id}: ${safeMessage}`,
                        e,
                    );
                } else {
                    // In non-development environments, avoid logging full error objects
                    console.error(
                        `Error parsing playerChart for game ${g.$id}: ${safeMessage}`,
                    );
                }
                return acc;
            }

            // Only include games with valid, non-empty lineups
            if (!Array.isArray(playerChart) || playerChart.length === 0) {
                return acc;
            }

            const runsScored = parseInt(g.score) || 0;
            const opponentRuns = parseInt(g.opponentScore) || 0;
            const gameResult = g.result || "unknown";

            const entry = {
                gameId: g.$id,
                gameDate: g.gameDate || g.dateTime,
                lineup: playerChart, // Still has full objects here
                runsScored,
                opponentRuns,
                gameResult,
            };

            // Add stats if available for this game
            if (gameStats[g.$id]) {
                entry.stats = {};
                Object.entries(gameStats[g.$id]).forEach(
                    ([playerId, events]) => {
                        entry.stats[playerId] = events.join(" ");
                    },
                );
            }

            acc.push(entry);

            return acc;
        }, []);

        console.log(
            `Found ${historicalData.length} games with lineup and result data`,
        );

        // Step 4: Prepare Data for AI (Minification)

        // Minify History: Date, Score, OpponentScore, Lineup (IDs only), Stats (if avail)
        const minifiedHistory = historicalData.map((g) => {
            const entry = {
                d: g.gameDate,
                s: g.runsScored,
                o: g.opponentRuns,
                l: g.lineup.map((p) => p.$id),
            };

            if (g.stats) {
                entry.stats = g.stats;
            }

            return entry;
        });

        // Minify Available Players
        const minifiedPlayers = players.map((p) => ({
            $id: p.$id,
            f: p.firstName,
            l: p.lastName,
            g: p.gender,
            p: p.preferredPositions || [],
            d: p.dislikedPositions || [],
            b: p.bats,
        }));

        // Team Logic
        let idealPositioning = {};
        const lockedPlayers = []; // Extract locked players for explicit context

        if (team?.idealPositioning) {
            try {
                idealPositioning =
                    typeof team.idealPositioning === "string"
                        ? JSON.parse(team.idealPositioning)
                        : team.idealPositioning;

                // Extract neverSub (locked) players
                Object.entries(idealPositioning).forEach(([pos, items]) => {
                    if (Array.isArray(items)) {
                        items.forEach((item) => {
                            if (typeof item === "object" && item.neverSub) {
                                lockedPlayers.push({ id: item.id, pos });
                            }
                        });
                    }
                });
            } catch (e) {
                console.error("Error parsing idealPositioning:", e);
            }
        }

        const inputData = {
            team: {
                name: team.name, // Keep descriptive
                genderMix: team.genderMix,
                preferences: idealPositioning,
                locked: lockedPlayers,
            },
            history: minifiedHistory,
            availablePlayers: minifiedPlayers,
        };

        // Initialize the AI model with System Instructions
        const model = createModel({
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: lineupSchema,
            },
            systemInstruction: getLineupSystemInstruction(maxMaleBatters),
        });

        // Use "Data-as-a-Part" structure
        const prompts = [
            {
                text: "Analyze the following team data, historical performance, and available roster to generate an optimal lineup.",
            },
            {
                text: JSON.stringify(inputData),
            },
            {
                text: "Generate the JSON response following the schema, providing the best possible batting order and fielding rotation.",
            },
        ];

        // Generate the lineup using AI with streaming
        const streamIterator = await generateContentStream(model, prompts);

        // Convert async iterator to a standard ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let hasEnqueued = false;
                try {
                    for await (const chunk of streamIterator) {
                        controller.enqueue(encoder.encode(chunk));
                        hasEnqueued = true;
                    }
                    controller.close();
                } catch (e) {
                    console.error(
                        "Error while streaming AI lineup response:",
                        e,
                    );
                    if (!hasEnqueued) {
                        // Rollback generation count if immediate failure
                        if (rollbackGameId && rollbackCount !== null) {
                            try {
                                await updateDocument("games", rollbackGameId, {
                                    aiGenerationCount: rollbackCount,
                                });
                            } catch (cleanupError) {
                                console.error(
                                    "Failed to rollback generation count:",
                                    cleanupError,
                                );
                            }
                        }

                        const isDevelopment =
                            process.env.NODE_ENV === "development";
                        const errorPayload = {
                            error: "Failed to generate lineup",
                            details:
                                isDevelopment && e && e.message
                                    ? e.message
                                    : undefined,
                        };
                        controller.enqueue(
                            encoder.encode(JSON.stringify(errorPayload)),
                        );
                        controller.close();
                    } else {
                        // If we've already sent data, we can't cleanly send a JSON error.
                        // The client might see a broken JSON structure or a stream error.
                        // Ideally, the client handles mid-stream errors gracefully.
                        controller.error(e);
                    }
                }
            },
        });

        // Return the raw text stream immediately
        // The client will handle accumulation, parsing, and validation
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        // Rollback generation count if successfully incremented but failed later
        if (rollbackGameId && rollbackCount !== null) {
            try {
                await updateDocument("games", rollbackGameId, {
                    aiGenerationCount: rollbackCount,
                });
            } catch (cleanupError) {
                console.error(
                    "Failed to rollback generation count:",
                    cleanupError,
                );
            }
        }

        console.error("Error generating lineup:", error);

        const isDevelopment = process.env.NODE_ENV === "development";
        const safeErrorMessage = isDevelopment
            ? error.message || "Failed to generate lineup"
            : "Failed to generate lineup";

        return new Response(
            JSON.stringify({
                error: safeErrorMessage,
                details: isDevelopment ? error.stack : undefined,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
