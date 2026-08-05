import { Query, Presences } from "node-appwrite";
import { listDocuments } from "@/utils/databases";

/** Notification type → human-readable label */
const NOTIF_TYPE_LABELS = {
    lineup_finalized: "Lineup Posted",
    team_announcement: "Team Announcement",
    gametime_reminder: "Gametime Reminder",
};

/**
 * Safely extracts the custom `type` field from a push notification message's
 * nested data payload, handling both object and stringified-JSON variants.
 *
 * @param {object} msg - Raw Appwrite message object
 * @returns {string} Notification type key, or "other" if unresolvable
 */
function getNotifType(msg) {
    try {
        const d = msg.data;
        const payload = typeof d === "string" ? JSON.parse(d) : d;
        const inner = payload?.data;
        const innerData = typeof inner === "string" ? JSON.parse(inner) : inner;
        return innerData?.type || "other";
    } catch {
        return "other";
    }
}

/**
 * Fetches and aggregates all data needed for the admin dashboard.
 *
 * @param {{ users: object, client: object, sessionClient: object, range?: string }} params
 * @returns {Promise<object>} Structured dashboard data
 */
export async function getAdminDashboardData({
    users,
    client,
    sessionClient,
    range = "24h",
}) {
    // 1. Calculate timeframe for Umami and normalize range
    const VALID_RANGES = ["24h", "7d", "30d"];
    const normalizedRange = VALID_RANGES.includes(range) ? range : "24h";

    const activeClient = sessionClient || client;
    const rawClient = activeClient ? activeClient.client || activeClient : {};
    const presencesService = new Presences(rawClient);

    // 2. Fetch all Appwrite stats in parallel — core metrics + new widgets
    const [
        allUsers,
        allTeams,
        allGames,
        acceptedAtt,
        declinedAtt,
        tentativeAtt,
        recentGames,
        onlinePresences,
        teamsListResult,
        messagesResult,
        functionsResult,
        gameLogsResult,
        votesResult,
        awardsResult,
        userAchievementsResult,
    ] = await Promise.all([
        users.list([Query.limit(1)]),
        listDocuments("teams", [Query.limit(1)], client),
        listDocuments("games", [Query.limit(1)], client),
        listDocuments(
            "attendance",
            [Query.equal("status", "accepted"), Query.limit(1)],
            client,
        ),
        listDocuments(
            "attendance",
            [Query.equal("status", "declined"), Query.limit(1)],
            client,
        ),
        listDocuments(
            "attendance",
            [Query.equal("status", "tentative"), Query.limit(1)],
            client,
        ),
        listDocuments(
            "games",
            [Query.orderDesc("gameDate"), Query.limit(100)],
            client,
        ),
        presencesService.list({
            queries: [Query.equal("status", ["online"])],
        }),
        // Teams Roster: Appwrite native Teams service (includes member counts)
        client.teams.list(),
        // Push Notification stats: last 100 messages for type & failure analysis
        client.messaging.listMessages([
            Query.limit(100),
            Query.orderDesc("$createdAt"),
        ]),
        // Cloud Functions: enabled state + last deployment
        client.functions.list(),
        // Engagement & Recognition: game_logs (up to 1000 for half-inning analysis), votes, awards, user_achievements
        listDocuments(
            "game_logs",
            [
                Query.select(["eventType", "playerId", "halfInning", "gameId"]),
                Query.limit(1000),
                Query.orderDesc("$createdAt"),
            ],
            client,
        ).catch(() => ({
            total: 0,
            rows: [],
        })),
        listDocuments("votes", [Query.limit(1)], client).catch(() => ({
            total: 0,
            rows: [],
        })),
        listDocuments("awards", [Query.limit(1)], client).catch(() => ({
            total: 0,
            rows: [],
        })),
        listDocuments("user_achievements", [Query.limit(1)], client).catch(
            () => ({ total: 0, rows: [] }),
        ),
    ]);

    // 3. Park Popularity — Fallback to Season parkId if game parkId is missing
    const games = recentGames.rows || [];
    const seasonIds = [
        ...new Set(games.map((g) => g.seasonId).filter(Boolean)),
    ];

    let seasonMap = {};
    if (seasonIds.length > 0) {
        const resolvedSeasons = await listDocuments(
            "seasons",
            [Query.equal("$id", seasonIds)],
            client,
        );
        seasonMap = (resolvedSeasons.rows || []).reduce((acc, s) => {
            acc[s.$id] = s.parkId;
            return acc;
        }, {});
    }

    const parkCounts = games.reduce((acc, game) => {
        const parkId = game.parkId || seasonMap[game.seasonId];
        if (parkId) {
            acc[parkId] = (acc[parkId] || 0) + 1;
        }
        return acc;
    }, {});

    const topParkIds = Object.keys(parkCounts)
        .sort((a, b) => parkCounts[b] - parkCounts[a])
        .slice(0, 5);

    let activeParks = [];
    if (topParkIds.length > 0) {
        const resolvedParks = await listDocuments(
            "parks",
            [Query.equal("$id", topParkIds)],
            client,
        );

        activeParks = topParkIds
            .map((id) => {
                const park = resolvedParks.rows.find((p) => p.$id === id);
                return {
                    id,
                    name: park?.displayName || "Unknown Park",
                    gameCount: parkCounts[id],
                };
            })
            .filter((p) => p.name !== "Unknown Park");
    }

    // 4. Recent and active users
    const userList = await users.list([Query.limit(100)]);

    const recentUsers = [...userList.users]
        .sort((a, b) => new Date(b.registration) - new Date(a.registration))
        .slice(0, 25);

    const activeUsersList = [...userList.users]
        .filter((u) => u.accessedAt)
        .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt));

    // 5. Teams roster — sorted by member count, ghost flag for sparse teams
    const teamsRoster = (teamsListResult.teams || [])
        .sort((a, b) => b.total - a.total)
        .map((t) => ({
            id: t.$id,
            name: t.name,
            memberCount: Math.round(t.total),
            createdAt: t.$createdAt,
            isGhost: t.total <= 2,
        }));

    // 6. Notification stats from last 100 messages
    const messages = messagesResult.messages || [];
    const notifTotal = messagesResult.total || 0;

    const typeCounts = {};
    let failedInSample = 0;

    for (const msg of messages) {
        if (msg.status === "failed") failedInSample++;
        const type = getNotifType(msg);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    const notificationStats = {
        total: notifTotal,
        sampleSize: messages.length,
        failedInSample,
        failRate:
            messages.length > 0
                ? Math.round((failedInSample / messages.length) * 100)
                : 0,
        byType: Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
                type,
                label: NOTIF_TYPE_LABELS[type] || type.replace(/_/g, " "),
                count,
            })),
    };

    // 7. Cloud functions health & last run execution
    const cloudFunctions = await Promise.all(
        (functionsResult.functions || []).map(async (fn) => {
            let lastRun = null;
            try {
                const execs = await client.functions.listExecutions(fn.$id, [
                    Query.limit(1),
                    Query.orderDesc("$createdAt"),
                ]);
                if (execs.executions && execs.executions.length > 0) {
                    lastRun = execs.executions[0].$createdAt;
                }
            } catch {
                // Graceful fallback if executions query fails
            }
            return {
                id: fn.$id,
                name: fn.name,
                enabled: fn.enabled,
                updatedAt: fn.$updatedAt,
                lastRun,
            };
        }),
    );

    // 8. Engagement & Play Analytics (Strict Team Batting Filter)
    const totalGamesNum = allGames.total || 1;

    const EVENT_LABELS = {
        single: "Single (1B)",
        double: "Double (2B)",
        triple: "Triple (3B)",
        homerun: "Home Run (HR)",
        walk: "Walk (BB)",
        strikeout: "Strikeout (K)",
        ground_out: "Ground Out",
        fly_out: "Fly Out",
        line_out: "Line Out",
        pop_out: "Pop Out",
        error: "Error (E)",
        fielders_choice: "Fielder's Choice",
        sacrifice_fly: "Sacrifice Fly",
        injury_remove: "Injury Remove",
    };

    const gameMap = (games || []).reduce((acc, g) => {
        acc[g.$id] = g;
        return acc;
    }, {});

    const allLogRows = gameLogsResult?.rows || [];
    const teamEventCounts = {};
    let teamBattingTotal = 0;

    for (const log of allLogRows) {
        if (!log.playerId || log.eventType === "opponent_run") continue;
        const game = gameMap[log.gameId];
        const isHome = game?.isHomeGame === true || game?.isHomeGame === "true";
        // In baseball: Home team fields in "top" (opponent at bat), Away team fields in "bottom" (opponent at bat)
        const isOpponentHalfInning = isHome
            ? log.halfInning === "top"
            : log.halfInning === "bottom";

        if (isOpponentHalfInning) continue;

        teamBattingTotal++;
        const type = log.eventType || "other";
        teamEventCounts[type] = (teamEventCounts[type] || 0) + 1;
    }

    const byType = Object.entries(teamEventCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
            type,
            label: EVENT_LABELS[type] || type.replace(/_/g, " "),
            count,
            percentage:
                teamBattingTotal > 0
                    ? Math.round((count / teamBattingTotal) * 100)
                    : 0,
        }));

    const gameLogsStats = {
        total: teamBattingTotal,
        avgPerGame:
            totalGamesNum > 0
                ? (teamBattingTotal / totalGamesNum).toFixed(1)
                : "0",
        byType,
    };

    const recognitionStats = {
        votes: {
            total: votesResult?.total || 0,
            perGame:
                totalGamesNum > 0
                    ? ((votesResult?.total || 0) / totalGamesNum).toFixed(1)
                    : "0",
        },
        awards: {
            total: awardsResult?.total || 0,
            perGame:
                totalGamesNum > 0
                    ? ((awardsResult?.total || 0) / totalGamesNum).toFixed(1)
                    : "0",
        },
        achievements: {
            total: userAchievementsResult?.total || 0,
            perGame:
                totalGamesNum > 0
                    ? (
                          (userAchievementsResult?.total || 0) / totalGamesNum
                      ).toFixed(1)
                    : "0",
        },
    };

    return {
        stats: {
            totalUsers: allUsers.total,
            totalTeams: allTeams.total,
            totalGames: allGames.total,
            attendance: {
                accepted: acceptedAtt.total,
                declined: declinedAtt.total,
                tentative: tentativeAtt.total,
                total:
                    acceptedAtt.total + declinedAtt.total + tentativeAtt.total,
            },
            activeUsers: onlinePresences?.total || 0,
        },
        recentUsers,
        activeUsers: activeUsersList,
        activeParks,
        range: normalizedRange,
        teamsRoster,
        notificationStats,
        cloudFunctions,
        gameLogsStats,
        recognitionStats,
    };
}
