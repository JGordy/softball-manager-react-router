import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import { createAdminClient } from "@/utils/appwrite/server";
import { parsePlayerChart } from "@/routes/gameday/utils/gamedayUtils";
import { calculatePlayerStats } from "@/utils/stats";

/**
 * Loads all past guest players who have played or been rostered for a specific team.
 * Scans team games for temporary players in lineups and queries temporary users for the team.
 * Enriches each guest player with games played count, their most recent game, and batting stats.
 *
 * @param {object} params
 * @param {string} params.teamId - The team ID.
 * @param {object} params.client - Appwrite client (session or admin).
 * @param {Array<object>} [params.teamLogs] - Optional pre-fetched team logs for stat calculations.
 * @param {Array<object>} [params.teamGames] - Optional pre-fetched team games.
 * @returns {Promise<Array<object>>} List of enriched guest player objects.
 */
export async function getTeamGuestPlayers({
    teamId,
    client,
    teamLogs = [],
    teamGames = [],
}) {
    if (!teamId) return [];

    const activeClient = client || createAdminClient();
    const guestMap = new Map();

    try {
        // 1. Fetch any temporary players created explicitly for this team
        try {
            const tempUsersResponse = await listDocuments(
                "users",
                [
                    Query.equal("teamId", teamId),
                    Query.equal("isTemporary", true),
                    Query.limit(100),
                ],
                activeClient,
            );
            (tempUsersResponse.rows || []).forEach((u) => {
                guestMap.set(u.$id, {
                    ...u,
                    gameCount: 0,
                    recentGame: null,
                });
            });
        } catch (_tempErr) {
            // Index on teamId/isTemporary might not exist in all environments; fallback to games scan
        }

        // 2. Fetch team games if not passed in
        let games = teamGames;
        if (!games || games.length === 0) {
            try {
                const seasonsResponse = await listDocuments(
                    "seasons",
                    [Query.equal("teamId", teamId), Query.limit(100)],
                    activeClient,
                );
                const seasonIds = (seasonsResponse.rows || []).map(
                    (s) => s.$id,
                );
                if (seasonIds.length > 0) {
                    const gamesResponse = await listDocuments(
                        "games",
                        [Query.equal("seasons", seasonIds), Query.limit(150)],
                        activeClient,
                    );
                    games = gamesResponse.rows || [];
                }
            } catch (gamesErr) {
                console.warn(
                    "[getTeamGuestPlayers] Error fetching games:",
                    gamesErr,
                );
            }
        }

        // 3. Scan games to count appearances and discover any other guests
        const extraGuestIdsToFetch = new Set();
        const appearancesByGuestId = new Map();
        const recentGameByGuestId = new Map();

        // Sort games descending by date to find most recent easily
        const sortedGames = [...games].sort((a, b) => {
            const dateA = new Date(a.gameDate || a.$createdAt || 0).getTime();
            const dateB = new Date(b.gameDate || b.$createdAt || 0).getTime();
            return dateB - dateA;
        });

        for (const game of sortedGames) {
            if (!game.playerChart) continue;
            const parsedChart = parsePlayerChart(game.playerChart);
            if (!Array.isArray(parsedChart)) continue;

            const seenInThisGame = new Set();

            parsedChart.forEach((slot) => {
                if (!slot || typeof slot !== "object") return;
                const starterId = slot.$id;
                if (typeof starterId === "string" && starterId.trim() !== "") {
                    seenInThisGame.add(starterId);
                }

                if (Array.isArray(slot.substitutions)) {
                    slot.substitutions.forEach((sub) => {
                        if (
                            sub &&
                            typeof sub.playerId === "string" &&
                            sub.playerId.trim() !== ""
                        ) {
                            seenInThisGame.add(sub.playerId);
                        }
                    });
                }
            });

            for (const playerId of seenInThisGame) {
                // If we don't have this user yet, mark to check if they're a guest
                if (!guestMap.has(playerId)) {
                    extraGuestIdsToFetch.add(playerId);
                }

                // Increment appearance count
                appearancesByGuestId.set(
                    playerId,
                    (appearancesByGuestId.get(playerId) || 0) + 1,
                );

                // Set recent game if not already set (since games are sorted desc)
                if (!recentGameByGuestId.has(playerId)) {
                    recentGameByGuestId.set(playerId, {
                        gameId: game.$id,
                        date: game.gameDate,
                        opponent: game.opponent,
                    });
                }
            }
        }

        // Fetch unknown players to check if they are temporary guests
        if (extraGuestIdsToFetch.size > 0) {
            const ids = Array.from(extraGuestIdsToFetch);
            const userDocs = await Promise.all(
                ids.map((id) =>
                    readDocument("users", id, [], activeClient).catch(
                        () => null,
                    ),
                ),
            );

            userDocs.forEach((doc) => {
                if (doc && doc.isTemporary) {
                    guestMap.set(doc.$id, doc);
                }
            });
        }

        // 4. Enrich guests with appearances, recent game, and stats
        const result = [];
        for (const [id, guest] of guestMap.entries()) {
            const gameCount = appearancesByGuestId.get(id) || 0;
            const recentGame = recentGameByGuestId.get(id) || null;

            // Calculate stats from teamLogs
            const playerLogs = (teamLogs || []).filter(
                (l) => l.playerId === id,
            );
            const playerStats = calculatePlayerStats(playerLogs, id);
            const ab = playerStats.ab || 0;
            const hits = playerStats.hits || 0;
            const avg = playerStats.calculated?.avg || ".000";

            result.push({
                $id: guest.$id,
                userId: guest.userId || guest.$id,
                firstName: guest.firstName || "Guest",
                lastName: guest.lastName || "Player",
                gender: guest.gender || "Male",
                gameCount,
                recentGame,
                stats: {
                    ab,
                    hits,
                    avg,
                },
            });
        }

        // Sort by most recent game date (desc), then game count (desc), then name (asc)
        return result.sort((a, b) => {
            const timeA = a.recentGame?.date
                ? new Date(a.recentGame.date).getTime()
                : 0;
            const timeB = b.recentGame?.date
                ? new Date(b.recentGame.date).getTime()
                : 0;

            if (timeB !== timeA) {
                return timeB - timeA;
            }

            if (b.gameCount !== a.gameCount) {
                return b.gameCount - a.gameCount;
            }
            return (a.firstName || "").localeCompare(b.firstName || "");
        });
    } catch (error) {
        console.error(
            "[getTeamGuestPlayers] Failed to load guest players:",
            error,
        );
        return [];
    }
}
