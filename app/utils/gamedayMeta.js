/**
 * Helper to truncate a string to a max length cleanly at word boundary.
 *
 * @param {string} text - The input string.
 * @param {number} maxLength - Maximum character length.
 * @returns {string} Truncated string.
 */
export function truncateCleanly(text, maxLength = 160) {
    if (!text || typeof text !== "string") return "";
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned.length <= maxLength) return cleaned;

    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.7) {
        return `${truncated.slice(0, lastSpace)}...`;
    }
    return `${truncated}...`;
}

/**
 * Builds dynamic meta tags (title, description, og:*, twitter:*) for games and event details.
 *
 * @param {Object} params - Meta configuration parameters.
 * @param {Object} [params.game] - Game data object.
 * @param {Array<Object>} [params.teams] - Teams associated with the event.
 * @param {Object} [params.season] - Season document.
 * @param {string} [params.location] - Location override.
 * @param {string} [params.origin] - Request origin URL (e.g., "https://rostrhq.app").
 * @param {boolean} [params.isGamedayView] - Whether this is the live gameday route.
 * @returns {Array<Object>} Array of meta descriptors for React Router v7.
 */
export function buildGamedayMeta({
    game,
    teams = [],
    season = null,
    location = "",
    origin = "",
    isGamedayView = true,
} = {}) {
    if (!game) return [];

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

    const venue = game.location || location || season?.location || "";

    const baseUrl =
        origin ||
        (typeof process !== "undefined" && process.env?.APP_URL) ||
        "https://rostrhq.app";

    const ogImageUrl = game.$id
        ? `${baseUrl.replace(/\/+$/, "")}/api/og/game/${game.$id}.png`
        : `${baseUrl.replace(/\/+$/, "")}/android-chrome-icon-512x512.png`;

    let title = "";
    let description = "";

    const isFinal = Boolean(game.gameFinal);
    const teamScore = Number(game.score || 0);
    const oppScore = Number(game.opponentScore || 0);

    if (isFinal) {
        // Option B: Outcome-focused
        if (teamScore > oppScore) {
            title = `Final: ${teamName} Win ${teamScore}-${oppScore} vs ${opponentName} | RostrHQ`;
        } else if (teamScore < oppScore) {
            title = `Final: ${opponentName} Defeat ${teamName} ${oppScore}-${teamScore} | RostrHQ`;
        } else {
            title = `Final: ${teamName} ${teamScore}, ${opponentName} ${oppScore} (Tie) | RostrHQ`;
        }

        if (game.recap) {
            description = truncateCleanly(game.recap, 160);
        } else {
            const venuePart = venue ? ` at ${venue}` : "";
            description = `Final Score: ${teamName} ${teamScore}, ${opponentName} ${oppScore}${venuePart}. View full box score, spray charts, and recap on RostrHQ.`;
        }
    } else {
        const hasLiveScore =
            game.score !== undefined &&
            game.opponentScore !== undefined &&
            (teamScore > 0 || oppScore > 0);

        if (isGamedayView) {
            if (hasLiveScore) {
                title = `Live: ${teamName} ${teamScore}, ${opponentName} ${oppScore} | RostrHQ`;
                description = `Live softball scoring from ${venue || "the diamond"}: ${teamName} vs ${opponentName}. Follow live play-by-play on RostrHQ.`;
            } else {
                title = `Live Gameday: ${teamName} vs ${opponentName} | RostrHQ`;
                description = `Follow live scoring, play-by-play, and lineups for ${teamName} vs ${opponentName} on ${gameDateFormatted || "game day"}.`;
            }
        } else {
            title = `${teamName} vs ${opponentName} - ${gameDateFormatted || "Game Details"} | RostrHQ`;
            const venuePart = venue ? ` at ${venue}` : "";
            description = `Live score, rosters, and lineups for ${teamName} vs ${opponentName}${venuePart} on ${gameDateFormatted || "game day"}.`;
        }
    }

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:type", content: "image/png" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImageUrl },
    ];
}
