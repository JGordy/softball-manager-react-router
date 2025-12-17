import { createModel, generateContent, parseAIResponse } from "@/utils/ai";
import { listDocuments } from "@/utils/databases";
import { Query } from "node-appwrite";

import lineupSchema from "./utils/lineupSchema";
import lineupPrompt from "./utils/lineupPrompt";

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
        const historicalData = seasonGames.rows
            .filter((g) => g.playerChart && g.result)
            .map((g) => {
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
                    console.error(
                        `Error parsing playerChart for game ${g.$id}:`,
                        e,
                    );
                }

                // The result data is stored directly on the game object, not nested
                const runsScored = parseInt(g.score) || 0;
                const opponentRuns = parseInt(g.opponentScore) || 0;
                const gameResult = g.result || "unknown";

                return {
                    gameId: g.$id,
                    gameDate: g.gameDate || g.dateTime,
                    lineup: playerChart,
                    runsScored,
                    opponentRuns,
                    gameResult,
                };
            })
            .filter((g) => Array.isArray(g.lineup) && g.lineup.length > 0); // Only include games with valid lineups

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
        const fullPrompt = `${lineupPrompt}${teamContext}${historicalContext}${fieldingContext}

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
6. Do not send reasoning for field positioning

Generate the optimal lineup now with your detailed reasoning.`;

        // Generate the lineup using AI
        const responseText = await generateContent(model, fullPrompt);

        // Parse the AI response
        const aiResponse = parseAIResponse(responseText);

        if (!aiResponse || !aiResponse.lineup) {
            throw new Error("Failed to parse AI response");
        }

        const generatedLineup = aiResponse.lineup;
        const reasoning = aiResponse.reasoning || "No reasoning provided";

        // Validate the response structure
        if (
            !Array.isArray(generatedLineup) ||
            generatedLineup.length !== players.length
        ) {
            throw new Error("AI response does not match expected format");
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

        return new Response(
            JSON.stringify({
                error: error.message || "Failed to generate lineup",
                details:
                    process.env.NODE_ENV === "development"
                        ? error.stack
                        : undefined,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
