import { createModel, parseAIResponse } from "@/utils/ai";
import { listDocuments } from "@/utils/databases";
import { Query } from "node-appwrite";

import lineupSchema from "./utils/lineupSchema";
import { getLineupSystemInstruction } from "./utils/systemInstructions";

/**
 * Sanitize reasoning text to remove any database IDs that might have been included by the AI
 * @param {string} reasoning - The reasoning text from the AI
 * @returns {string} Sanitized reasoning text without database IDs
 */
function sanitizeReasoning(reasoning) {
    if (!reasoning) return reasoning;

    // Remove patterns that look like Appwrite database IDs (fixed-length alphanumeric strings, ~20 chars)
    // Pattern: [ID: <id>] or ID: <id> or just standalone IDs
    return reasoning
        .replace(/\[ID:\s*[a-zA-Z0-9_-]{20}\]/g, "")
        .replace(/ID:\s*[a-zA-Z0-9_-]{20}\b/g, "")
        .replace(/\$id[:\s]*['"]*[a-zA-Z0-9_-]{20}['"]*\b/g, "")
        .trim();
}

/**
 * Generate an optimal softball lineup based on historical performance data
 * POST /api/generate/lineup
 *
 * @param {Request} request - The request object containing player data, team info, and game details
 * @returns {Response} JSON response with the generated lineup or error
 */
export async function action({ request }) {
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

        // Step 1: Get the game to find its season
        const game = await listDocuments("games", [
            Query.equal("$id", gameId),
        ]).then((response) => response.rows[0]);

        if (!game || !game.seasonId) {
            return new Response(
                JSON.stringify({
                    error: "Game not found or not associated with a season",
                }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const seasonId = game.seasonId;

        // Step 2: Get all games from this season that have results
        const seasonGames = await listDocuments("games", [
            Query.equal("seasonId", seasonId),
            Query.isNotNull("result"),
        ]);

        // Step 3: Gather lineup and result data for each game
        // Filter and validate games with proper error handling
        const historicalData = seasonGames.rows.reduce((acc, g) => {
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
                // Log error
                console.error(`Error parsing playerChart for game ${g.$id}`, e);
                return acc;
            }

            // Only include games with valid, non-empty lineups
            if (!Array.isArray(playerChart) || playerChart.length === 0) {
                return acc;
            }

            const runsScored = parseInt(g.score) || 0;
            const opponentRuns = parseInt(g.opponentScore) || 0;
            const gameResult = g.result || "unknown";

            acc.push({
                gameId: g.$id,
                gameDate: g.gameDate || g.dateTime,
                lineup: playerChart, // Still has full objects here
                runsScored,
                opponentRuns,
                gameResult,
            });

            return acc;
        }, []);

        console.log(
            `Found ${historicalData.length} games with lineup and result data`,
        );

        // Step 4: Prepare Data for AI (Minification)

        // Minify History: Date, Score, OpponentScore, Lineup (IDs only)
        const minifiedHistory = historicalData.map((g) => ({
            d: g.gameDate,
            s: g.runsScored,
            o: g.opponentRuns,
            l: g.lineup.map((p) => p.$id),
        }));

        // Minify Available Players
        const minifiedPlayers = players.map((p) => ({
            $id: p.$id,
            n: `${p.firstName} ${p.lastName}`,
            g: p.gender,
            p: p.preferredPositions || [],
            d: p.dislikedPositions || [],
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
            systemInstruction: getLineupSystemInstruction(),
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

        // Generate the lineup using AI
        // Note: generateContent accepts array of parts
        const result = await model.generateContent(prompts);
        const response = await result.response;
        const responseText = response.text();

        // Parse the AI response
        const aiResponse = parseAIResponse(responseText);

        if (!aiResponse || !aiResponse.lineup) {
            throw new Error("Failed to parse AI response");
        }

        const generatedLineup = aiResponse.lineup;
        const reasoning = sanitizeReasoning(
            aiResponse.reasoning || "No reasoning provided",
        );

        // Validate the response structure: must be a non-empty array
        if (!Array.isArray(generatedLineup) || generatedLineup.length === 0) {
            throw new Error(
                "AI response does not match expected lineup format",
            );
        }

        // Warn (but do not fail) if the lineup length differs from the input players length
        if (generatedLineup.length !== players.length) {
            console.warn(
                "Generated lineup length differs from input players length",
                {
                    expectedPlayers: players.length,
                    generatedLineupLength: generatedLineup.length,
                },
            );
        }

        // Output Validation & Enrichment
        // The AI output needs to be mapped back to the required frontend structure if keys were missing,
        // but schema already enforces firstName, lastName, etc.
        // We ensure consistent data types.

        const validatedLineup = generatedLineup.map((player) => {
            if (!player.positions || player.positions.length !== 7) {
                throw new Error(
                    `Invalid positions array for player ${player.$id}`,
                );
            }
            return {
                $id: player.$id,
                firstName: player.firstName,
                lastName: player.lastName,
                gender: player.gender,
                positions: player.positions,
            };
        });

        // Validate that the generated lineup player IDs match the input player IDs
        const inputPlayerIdSet = new Set(players.map((p) => p.$id));
        const lineupPlayerIds = validatedLineup.map((p) => p.$id);
        const lineupPlayerIdSet = new Set(lineupPlayerIds);

        // Ensure there are no duplicate player IDs in the generated lineup
        if (lineupPlayerIds.length !== lineupPlayerIdSet.size) {
            throw new Error("Generated lineup contains duplicate player IDs");
        }

        // Ensure the lineup contains exactly the same player IDs as the input
        if (lineupPlayerIdSet.size !== inputPlayerIdSet.size) {
            throw new Error(
                "Generated lineup does not contain the same number of unique players as the input",
            );
        }

        for (const id of inputPlayerIdSet) {
            if (!lineupPlayerIdSet.has(id)) {
                throw new Error(
                    `Generated lineup is missing player with id ${id}`,
                );
            }
        }

        for (const id of lineupPlayerIdSet) {
            if (!inputPlayerIdSet.has(id)) {
                throw new Error(
                    `Generated lineup contains unknown player with id ${id}`,
                );
            }
        }

        // Return the generated lineup with reasoning
        return new Response(
            JSON.stringify({
                success: true,
                lineup: validatedLineup,
                reasoning,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
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
