import { getEventById } from "@/loaders/games";
import { generateScoreboardSvg } from "@/utils/scoreboardSvg";

/**
 * Server-side loader for the dynamic scoreboard Open Graph image route.
 * Renders high-resolution scoreboard cards in PNG (or SVG if requested).
 *
 * @param {Object} context - React Router loader context.
 * @param {Request} context.request - Incoming HTTP request.
 * @param {Object} context.params - Route parameters.
 * @returns {Promise<Response>} Image response.
 */
export async function loader({ request, params }) {
    const rawEventId = params.eventId || "";
    const cleanEventId = rawEventId.replace(/\.(png|svg|jpg|jpeg)$/i, "");
    const isSvg =
        rawEventId.toLowerCase().endsWith(".svg") ||
        request.url.includes(".svg");

    let teamName = "Our Team";
    let opponentName = "Opponent";
    let teamScore = 0;
    let opponentScore = 0;
    let isGameFinal = false;

    if (cleanEventId) {
        try {
            const { createAdminClient } = await import(
                "@/utils/appwrite/server"
            );
            const client = createAdminClient();

            const eventData = await getEventById({
                eventId: cleanEventId,
                client,
                includeWeather: false,
                includeAttendance: false,
                includeAwards: false,
                includeVotes: false,
                includePark: false,
            });

            if (eventData && eventData.game) {
                const { game, teams } = eventData;
                const primaryTeam = teams?.[0] || {};
                teamName = primaryTeam.name || "Our Team";
                opponentName = game.opponent || "Opponent";
                teamScore = Number(game.score || 0);
                opponentScore = Number(game.opponentScore || 0);
                isGameFinal = Boolean(game.gameFinal);
            }
        } catch (error) {
            console.error(
                `Failed to fetch game details for OG image (${cleanEventId}):`,
                error,
            );
        }
    }

    const svg = generateScoreboardSvg({
        teamName,
        opponentName,
        teamScore,
        opponentScore,
        isGameFinal,
    });

    const cacheControl = isGameFinal
        ? "public, max-age=3600, s-maxage=86400"
        : "public, max-age=30, s-maxage=60";

    if (isSvg) {
        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": cacheControl,
            },
        });
    }

    try {
        const { Resvg } = await import("@resvg/resvg-js");
        const resvg = new Resvg(svg, {
            fitTo: { mode: "width", value: 1200 },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return new Response(pngBuffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": cacheControl,
            },
        });
    } catch (renderError) {
        console.error("Resvg PNG rasterization fallback to SVG:", renderError);
        return new Response(svg, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": cacheControl,
            },
        });
    }
}
