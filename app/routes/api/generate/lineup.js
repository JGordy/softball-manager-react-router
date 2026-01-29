import { createModel, generateContent, parseAIResponse } from "@/utils/ai";
import { listDocuments } from "@/utils/databases";
import { Query } from "node-appwrite";

import lineupSchema from "./utils/lineupSchema";
import lineupPrompt from "./utils/lineupPrompt";

/**
 * Build the complete prompt for the AI lineup generation
 * @param {Object} params - Parameters for building the prompt
 * @returns {string} The complete prompt
 */
function buildFullPrompt({
    lineupPrompt,
    teamContext,
    historicalContext,
    fieldingContext,
    playerData,
}) {
    return `${lineupPrompt}${teamContext}${historicalContext}${fieldingContext}

## AVAILABLE PLAYERS FOR THIS GAME
${JSON.stringify(playerData, null, 2)}

## YOUR TASK
Analyze the historical data above and generate the "HOTTEST" lineup - the batting order most likely to produce HIGH OFFENSIVE OUTPUT based on the patterns you observe in successful games. Remember to maintain gender balance rules for coed teams.

For fielding positions, prioritize the team's idealPositioning preferences, then distribute remaining positions fairly.

**IMPORTANT**: You must provide detailed reasoning explaining:
1. What patterns you identified in the historical data
2. Why you chose this specific batting order
3. Which players or combinations showed strong performance
4. How you balanced performance data with league rules
5. Any specific insights from high-scoring games
6. Do NOT send reasoning for field positioning
7. Do NOT include player $id's in your reasoning response as this will get rendered to the user

Generate the optimal lineup now with your detailed reasoning.`;
}

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

        // Step 3 & 4: Gather lineup and result data for each game
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
                // Log error without exposing potentially sensitive player data
                const errorMessage =
                    e instanceof Error && e.message ? e.message : String(e);
                const safeErrorMessage =
                    errorMessage.length > 200
                        ? `${errorMessage.slice(0, 200)}...`
                        : errorMessage;

                console.error(
                    `Error parsing playerChart for game ${g.$id}: ${safeErrorMessage}`,
                );
                // Skip this game's data instead of including empty lineup
                return acc;
            }

            // Only include games with valid, non-empty lineups
            if (!Array.isArray(playerChart) || playerChart.length === 0) {
                return acc;
            }

            // The result data (score, opponentScore, result) is stored directly on the game object, not in a nested result object
            const runsScored = parseInt(g.score) || 0;
            const opponentRuns = parseInt(g.opponentScore) || 0;
            const gameResult = g.result || "unknown";

            acc.push({
                gameId: g.$id,
                gameDate: g.gameDate || g.dateTime,
                lineup: playerChart,
                runsScored,
                opponentRuns,
                gameResult,
            });

            return acc;
        }, []);

        console.log(
            `Found ${historicalData.length} games with lineup and result data`,
        );

        // Initialize the AI model with JSON schema for structured output
        const model = createModel({
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: lineupSchema,
            },
        });

        // Prepare player data for the AI (only include relevant fields)
        const playerData = players.map((p) => ({
            $id: p.$id,
            firstName: p.firstName,
            lastName: p.lastName,
            gender: p.gender,
            preferredPositions: p.preferredPositions || [],
            dislikedPositions: p.dislikedPositions || [],
        }));

        // Build historical performance context
        const historicalContext =
            historicalData.length > 0
                ? `

## HISTORICAL PERFORMANCE DATA
You have access to ${historicalData.length} previous games from this season with lineup and scoring data.
Your task is to analyze these lineups and identify patterns that correlate with HIGH OFFENSIVE OUTPUT (runs scored).

**ANALYSIS INSTRUCTIONS:**
1. Look for patterns: Which players batting together produced more runs?
2. Identify 'hot' batting positions: Which spots in the order tend to produce runs?
3. Notice successful sequences: Did certain player combinations work well?
4. Consider overall team performance: Games with higher run totals
5. Generate a lineup that replicates these successful patterns

**PREVIOUS GAMES:**
${historicalData
    .map((game, index) => {
        const lineupList = game.lineup
            .map((player, pos) => {
                const matchingPlayer = playerData.find(
                    (p) => p.$id === player.$id,
                );
                const playerInfo = matchingPlayer
                    ? `${matchingPlayer.firstName} ${matchingPlayer.lastName} (${matchingPlayer.gender})`
                    : `${player.firstName || "Unknown"} ${player.lastName || "Player"}`;
                return `  ${pos + 1}. ${playerInfo} [ID: ${player.$id}]`;
            })
            .join("\n");

        return `
### Game ${index + 1} (${game.gameDate})
- Runs Scored: ${game.runsScored}
- Opponent Runs: ${game.opponentRuns}
- Result: ${game.gameResult}
- Batting Order:
${lineupList}`;
    })
    .join("\n")}
`
                : `

## NO HISTORICAL DATA AVAILABLE
This is the first game of the season or no previous games have results recorded.
Generate a balanced lineup based on player positions and gender balance rules.
`;

        // Parse team settings for fielding positioning
        let idealPositioning = {};

        if (team?.idealPositioning) {
            try {
                idealPositioning =
                    typeof team.idealPositioning === "string"
                        ? JSON.parse(team.idealPositioning)
                        : team.idealPositioning;
            } catch (e) {
                console.error("Error parsing idealPositioning:", e);
            }
        }

        const fieldingContext =
            Object.keys(idealPositioning).length > 0
                ? `

## TEAM FIELDING PREFERENCES
The team has preferred fielding positions for specific players. You MUST prioritize these assignments.

${(() => {
    // Helper to extract locked players for emphasis
    const lockedDescriptions = [];
    Object.entries(idealPositioning).forEach(([pos, items]) => {
        if (Array.isArray(items)) {
            items.forEach((item) => {
                if (typeof item === "object" && item.neverSub) {
                    const player = playerData.find((p) => p.$id === item.id);
                    if (player) {
                        // Only if player is playing today
                        lockedDescriptions.push(
                            `- ${player.firstName} ${player.lastName} (ID: ${player.$id}) MUST play ${pos} for ALL INNINGS.`,
                        );
                    }
                }
            });
        }
    });

    if (lockedDescriptions.length > 0) {
        return `**CRITICAL - NEVER SUB (LOCKED) PLAYERS:**
The following players MUST NOT ROTATE. Assign them to their locked position for EVERY inning:
${lockedDescriptions.join("\n")}
\n`;
    }
    return "";
})()}
Preferred fielding assignments (position -> player IDs):
${JSON.stringify(idealPositioning, null, 2)}

For positions without team preferences, distribute players fairly based on their preferredPositions.
`
                : "";

        // Build team context for gender rules
        const teamContext =
            team?.genderMix === "Coed"
                ? `

**CRITICAL LEAGUE RULE**: This is a COED team. You MUST enforce the gender balance rule: no more than 3 consecutive male batters.
`
                : `

This is a same-gender team. Gender balance rules do not apply to batting order.
`;

        // Build the complete prompt
        const fullPrompt = buildFullPrompt({
            lineupPrompt,
            teamContext,
            historicalContext,
            fieldingContext,
            playerData,
        });

        // Generate the lineup using AI
        const responseText = await generateContent(model, fullPrompt);

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

        // Ensure each player has exactly 7 positions
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
