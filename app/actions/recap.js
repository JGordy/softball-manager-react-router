import { Query } from "node-appwrite";
import { createModel, generateContent } from "@/utils/ai";
import {
    listDocuments,
    readDocument,
    updateDocument,
} from "@/utils/databases.js";

/**
 * Background action to generate a game recap using Gemini 3.5 Flash and write it to the games collection.
 * This runs asynchronously in the background so that the scorekeeper's end-game request finishes instantly.
 *
 * @param {Object} params - Parameter container
 * @param {string} params.eventId - The ID of the game to generate the recap for
 * @param {Object} params.client - The Appwrite server client
 * @returns {Promise<void>} Resolves when the recap has been successfully written to the database
 */
export async function generateGameRecapBackground({ eventId, client }) {
    try {
        if (!eventId) {
            throw new Error(
                "generateGameRecapBackground: eventId is strictly required",
            );
        }
        if (!client) {
            throw new Error(
                "generateGameRecapBackground: client is strictly required",
            );
        }

        // 1. Fetch the basic game document to get scores, opponent, and team context
        const game = await readDocument("games", eventId, [], client);
        if (!game) {
            throw new Error(
                `generateGameRecapBackground: Game ${eventId} not found`,
            );
        }

        // 2. Fetch recent play-by-play logs for this game sorted chronologically
        const logsResponse = await listDocuments(
            "game_logs",
            [
                Query.equal("gameId", eventId),
                Query.orderAsc("$createdAt"),
                Query.limit(200), // Secure upper bound for extreme games
            ],
            client,
        );
        const logs = logsResponse?.rows || [];

        if (logs.length === 0) {
            console.log(
                `generateGameRecapBackground: No game logs found for game ${eventId}. Skipping recap generation.`,
            );
            return;
        }

        // 3. Format the game summary & log sequence for the prompt
        const gameDetailsContext = {
            teamName: game.teamId ? "Our Team" : "Home Team",
            opponent: game.opponent || "Opponent",
            score: game.score || "0",
            opponentScore: game.opponentScore || "0",
            result: game.result || "unknown",
            date: game.gameDate || game.dateTime || "Unknown Date",
        };

        // Attempt to fetch actual team details for a friendlier recap name
        if (game.teamId) {
            try {
                const team = await readDocument(
                    "teams",
                    game.teamId,
                    [],
                    client,
                );
                if (team && team.name) {
                    gameDetailsContext.teamName = team.name;
                }
            } catch (err) {
                console.warn(
                    "generateGameRecapBackground: Failed to fetch team name context, using default.",
                    err.message,
                );
            }
        }

        // Format play-by-play narrative context into clean lines
        const playByPlayLines = logs.map((log) => {
            const inningInfo = `Inning ${log.inning} (${log.halfInning || "top"}):`;
            const description = log.description || `${log.eventType || "play"}`;
            const rbiInfo = log.rbi > 0 ? ` [${log.rbi} RBI]` : "";
            return `- ${inningInfo} ${description}${rbiInfo}`;
        });

        const promptText = `
You are a creative, professional, and enthusiastic sports journalist writing an editorial newspaper-style game recap for an amateur/semi-pro softball team.

Here are the details of the game:
- Team: ${gameDetailsContext.teamName}
- Opponent: ${gameDetailsContext.opponent}
- Final Score: ${gameDetailsContext.teamName} ${gameDetailsContext.score} - ${gameDetailsContext.opponentScore} ${gameDetailsContext.opponent}
- Result: ${gameDetailsContext.result.toUpperCase()}
- Date: ${gameDetailsContext.date}

Below is the chronological play-by-play log of the game:
${playByPlayLines.length > 0 ? playByPlayLines.join("\n") : "No plays were logged for this game."}

Write a compelling, engaging, and structured game recap in Markdown format.
Follow these guidelines:
1. **Headline**: Start with an exciting, catchy sports headline as a Title (# level 1). Do NOT add raw HTML tags like <h1>.
2. **Style**: Editorial sportswriter style—highly engaging, dramatic, yet concise. Highlight key plays, multi-run innings, defensive saves, and game-winning hits.
3. **Sections**: Use logical sections (e.g. ## Opening Frame, ## Mid-Game Action, ## The Turn, ## Key Performers) to make the text premium and readable.
4. **Tone**: Balanced, but lean positive and proud for ${gameDetailsContext.teamName} (or matching the final result).
5. **Length**: Keep it to approximately 3-4 paragraphs plus bullet points for key stars of the game.
6. **Formatting**: Ensure excellent markdown formatting, using bold text, bullet lists, and nice headings. Do NOT use markdown tables or raw html.

Recap:
`;

        // 4. Initialize Gemini Model (defaults to gemini-3.5-flash and low thinking)
        const model = createModel();

        // 5. Generate content using the new SDK wrapper
        const generatedRecap = await generateContent(model, promptText);

        if (!generatedRecap) {
            throw new Error(
                "generateGameRecapBackground: Gemini SDK returned an empty recap",
            );
        }

        // 6. Update the game document in the database
        await updateDocument(
            "games",
            eventId,
            { recap: generatedRecap },
            client,
        );
        console.log(
            `generateGameRecapBackground: Successfully completed and saved recap for game ${eventId}`,
        );
    } catch (error) {
        console.error(
            "generateGameRecapBackground: Fatal error generating game recap:",
            error,
        );
        throw error;
    }
}
