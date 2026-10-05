import { Query } from "node-appwrite";
import { DateTime } from "luxon";
import { createModel, generateContent } from "@/utils/ai";
import {
    listDocuments,
    readDocument,
    updateDocument,
} from "@/utils/databases.js";
import { getWeatherData } from "@/utils/weather.js";

/**
 * Condense weather data into a token-efficient summary representing the game end
 * and the 2 hours immediately preceding it, capturing cumulative precipitation.
 *
 * @param {Object} params
 * @param {Object} params.weatherData - The weather response from getWeatherData containing hourly array
 * @param {string|DateTime} [params.gameEndTime] - The ISO string or Luxon DateTime of the game end
 * @returns {string} Ultra-compact weather summary string (~10-25 tokens)
 */
export function formatRecapWeatherSummary({ weatherData, gameEndTime }) {
    if (
        !weatherData?.hourly ||
        !Array.isArray(weatherData.hourly) ||
        weatherData.hourly.length === 0
    ) {
        return "Unknown / Not recorded";
    }

    const endDt = gameEndTime
        ? typeof gameEndTime === "string"
            ? DateTime.fromISO(gameEndTime, { zone: "utc" })
            : gameEndTime
        : DateTime.utc();
    const validEndDt = endDt && endDt.isValid ? endDt : DateTime.utc();
    const endMillis = validEndDt.toMillis();
    const twoHoursBeforeMillis = validEndDt.minus({ hours: 2 }).toMillis();

    // Select hours falling in the 2-hour window up to game end
    let windowHours = weatherData.hourly.filter((h) => {
        const startMillis = DateTime.fromISO(h.interval.startTime, {
            zone: "utc",
        }).toMillis();
        return startMillis >= twoHoursBeforeMillis && startMillis <= endMillis;
    });

    // If no hours strictly fell within the 2-hour window, fall back to the hour closest to game end
    if (windowHours.length === 0) {
        let closestHour = null;
        let minDiff = Number.POSITIVE_INFINITY;
        for (const h of weatherData.hourly) {
            const startMillis = DateTime.fromISO(h.interval.startTime, {
                zone: "utc",
            }).toMillis();
            const diff = Math.abs(endMillis - startMillis);
            if (diff < minDiff) {
                minDiff = diff;
                closestHour = h;
            }
        }
        if (closestHour) {
            windowHours = [closestHour];
        }
    }

    if (windowHours.length === 0) {
        return "Unknown / Not recorded";
    }

    // 1. Condition: Pick the most representative condition.
    // If the latest hour experienced rain/precipitation, use latestHour;
    // otherwise, if an earlier hour in the 2-hr window experienced rain, use the most recent rain hour.
    const latestHour = windowHours[windowHours.length - 1];
    const isPrecipType = (type) =>
        type === "RAIN" ||
        type === "DRIZZLE" ||
        type === "THUNDERSTORM" ||
        type === "SNOW";

    const latestIsPrecip = isPrecipType(latestHour.weatherCondition?.type);
    const rainHour = [...windowHours]
        .reverse()
        .find((h) => isPrecipType(h.weatherCondition?.type));
    const conditionHour = latestIsPrecip ? latestHour : rainHour || latestHour;
    const conditionText =
        conditionHour.weatherCondition?.description?.text ||
        "Unknown Condition";

    // 2. Temperature & feels-like from the latest hour (at game conclusion)
    const temp =
        latestHour.temperature?.degrees != null
            ? `${Math.round(latestHour.temperature.degrees)}°F`
            : null;
    const feelsLike =
        latestHour.feelsLikeTemperature?.degrees != null
            ? `${Math.round(latestHour.feelsLikeTemperature.degrees)}°F`
            : null;
    const tempPart = temp
        ? feelsLike && feelsLike !== temp
            ? `${temp} (feels like ${feelsLike})`
            : temp
        : null;

    // 3. Cumulative precipitation across the 2-hour window
    const totalRainQpf = windowHours.reduce((acc, h) => {
        return acc + (h.precipitation?.qpf?.quantity || 0);
    }, 0);
    const maxPop = Math.max(
        ...windowHours.map((h) => h.precipitation?.probability?.percent || 0),
        0,
    );

    const hasRain = totalRainQpf > 0 || rainHour != null || maxPop >= 40;
    let precipPart = "";
    if (hasRain) {
        const rainDetails = [];
        if (totalRainQpf > 0) {
            rainDetails.push(
                `${parseFloat(totalRainQpf.toFixed(2))} in precip over 2 hrs`,
            );
        }
        if (maxPop > 0) {
            rainDetails.push(`${Math.round(maxPop)}% chance`);
        }
        if (rainDetails.length > 0) {
            precipPart = ` (${rainDetails.join(", ")})`;
        }
    }

    // 4. Wind info (from representative/latest hour)
    let windPart = "";
    const windSpeed = conditionHour.wind?.speed?.value;
    const windDir = conditionHour.wind?.direction?.cardinal;
    if (windSpeed != null && windSpeed >= 5) {
        windPart = `Wind ${Math.round(windSpeed)} mph${windDir ? ` ${windDir}` : ""}`;
    }

    // 5. Field conditions note
    let fieldNote = "";
    if (totalRainQpf >= 0.25) {
        fieldNote = "Sloppy and muddy field conditions.";
    } else if (hasRain || totalRainQpf > 0) {
        fieldNote = "Wet field conditions.";
    }

    // Assemble parts
    const coreDetails = [`${conditionText}${precipPart}`];
    if (tempPart) coreDetails.push(tempPart);
    if (windPart) coreDetails.push(windPart);

    let summary = coreDetails.join(", ");
    if (fieldNote) {
        summary += `. ${fieldNote}`;
    }

    return summary;
}

/**
 * Background action to generate a game recap using Gemini 3.8 Flash and write it to the games collection.
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
            location: "Unknown Location",
            weather: "Unknown / Not recorded",
        };

        let gameEndTime;
        const scheduledStart = game.gameDate || game.dateTime;
        const startDt = scheduledStart
            ? DateTime.fromISO(scheduledStart, { zone: "utc" })
            : null;

        if (startDt && startDt.isValid) {
            const lastLog = logs[logs.length - 1];
            const lastLogDt = lastLog?.$createdAt
                ? DateTime.fromISO(lastLog.$createdAt, { zone: "utc" })
                : null;

            if (
                lastLogDt &&
                lastLogDt.isValid &&
                lastLogDt.toMillis() >= startDt.toMillis() &&
                lastLogDt.diff(startDt, "hours").hours <= 4
            ) {
                gameEndTime = lastLogDt.toISO();
            } else {
                // Approximate standard softball game conclusion (2 hours after start)
                gameEndTime = startDt.plus({ hours: 2 }).toISO();
            }
        } else {
            gameEndTime =
                game.gameFinal && game.$updatedAt
                    ? game.$updatedAt
                    : DateTime.utc().toISO();
        }

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

        // Attempt to fetch park and weather details (fall back to season park/location if needed)
        let effectiveParkId = game.parkId;
        let effectiveLocation = game.location;

        if ((!effectiveParkId || !effectiveLocation) && game.seasonId) {
            try {
                const season = await readDocument(
                    "seasons",
                    game.seasonId,
                    [],
                    client,
                );
                if (season) {
                    effectiveParkId = effectiveParkId || season.parkId;
                    effectiveLocation = effectiveLocation || season.location;
                }
            } catch (err) {
                console.warn(
                    "generateGameRecapBackground: Failed to fetch season context for park/location fallback.",
                    err.message,
                );
            }
        }

        if (effectiveParkId) {
            try {
                const park = await readDocument(
                    "parks",
                    effectiveParkId,
                    [],
                    client,
                );
                if (park) {
                    gameDetailsContext.location =
                        park.formattedAddress ||
                        park.displayName ||
                        [park.city, park.state].filter(Boolean).join(", ") ||
                        effectiveLocation ||
                        "Unknown Location";

                    const weatherData = await getWeatherData(
                        effectiveParkId,
                        game,
                        client,
                    );
                    if (weatherData) {
                        gameDetailsContext.weather = formatRecapWeatherSummary({
                            weatherData,
                            gameEndTime,
                        });
                    }
                }
            } catch (err) {
                console.warn(
                    "generateGameRecapBackground: Failed to fetch park or weather context, using default.",
                    err.message,
                );
            }
        } else if (effectiveLocation) {
            gameDetailsContext.location = effectiveLocation;
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
- Location: ${gameDetailsContext.location}
- Weather: ${gameDetailsContext.weather}

Below is the chronological play-by-play log of the game:
${playByPlayLines.length > 0 ? playByPlayLines.join("\n") : "No plays were logged for this game."}

Write a compelling, engaging, and structured game recap in Markdown format.
Follow these guidelines:
1. **Headline**: Start with an exciting, catchy sports headline as a Title (# level 1). Do NOT add raw HTML tags like <h1>.
2. **Style**: Editorial sportswriter style—highly engaging, dramatic, yet concise. Highlight key plays, multi-run innings, defensive saves, and game-winning hits.
3. **Sections**: Use logical sections (e.g. ## Opening Frame, ## Mid-Game Action, ## The Turn, ## Key Performers) to make the text premium and readable.
4. **Tone**: Balanced, but lean positive and proud for ${gameDetailsContext.teamName} (or matching the final result).
5. **Weather & Atmosphere**: Accurately incorporate the provided game weather conditions (e.g. rain, wet field, mud, wind, chill, heat, rain accumulation) into the story atmosphere, describing how the elements affected play (e.g. playing through rain, slippery softballs, muddy basepaths). If weather is "Unknown / Not recorded", strictly do NOT invent, guess, or hallucinate atmospheric conditions (never write clichés like "On a crisp autumn evening" or "Under sunny skies"); focus strictly on the action on the field and venue.
6. **Length**: Keep it to approximately 3-4 paragraphs plus bullet points for key stars of the game.
7. **Formatting**: Ensure excellent markdown formatting, using bold text, bullet lists, and nice headings. Do NOT use markdown tables or raw html.

Recap:
`;

        // 4. Initialize Gemini Model with medium thinking for deep narrative reasoning and guardrail adherence
        const model = createModel({ thinking: "medium" });

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
