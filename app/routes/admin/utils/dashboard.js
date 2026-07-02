import { Query } from "node-appwrite";
import { listDocuments } from "@/utils/databases";

export async function getAdminDashboardData({ users, client, range = "24h" }) {
    // 1. Calculate timeframe for Umami and normalize range
    const VALID_RANGES = ["24h", "7d", "30d"];
    const normalizedRange = VALID_RANGES.includes(range) ? range : "24h";

    // 2. Fetch Appwrite Stats & metrics in parallel
    const [
        allUsers,
        allTeams,
        allGames,
        acceptedAtt,
        declinedAtt,
        tentativeAtt,
        recentGames,
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
    ]);

    // Park Popularity - Fallback to Season parkId if game parkId is missing
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

    // 4. Get some recent and active users for the dashboard
    // Fetch a combined list since Appwrite's Users service attributes for sorting
    // vary by version (e.g. accessedAt may not be queryable in older versions).
    const userList = await users.list([Query.limit(100)]);

    // Sort in-memory for consistency
    const recentUsers = [...userList.users]
        .sort((a, b) => new Date(b.registration) - new Date(a.registration))
        .slice(0, 25);

    const activeUsersList = [...userList.users]
        .filter((u) => u.accessedAt)
        .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt));
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
            activeUsers: activeUsersList.length,
        },
        recentUsers,
        activeUsers: activeUsersList,
        activeParks,
        range: normalizedRange,
    };
}
