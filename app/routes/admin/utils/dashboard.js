import { Query } from "node-appwrite";
import { listDocuments } from "@/utils/databases";
import { umamiService } from "@/utils/umami/server";

export async function getAdminDashboardData({ users, range = "24h" }) {
    // 1. Calculate timeframe for Umami and normalize range
    const now = Date.now();
    const VALID_RANGES = ["24h", "7d", "30d"];
    const normalizedRange = VALID_RANGES.includes(range) ? range : "24h";

    let startAt = now - 24 * 60 * 60 * 1000; // Default 24h

    if (normalizedRange === "7d") {
        startAt = now - 7 * 24 * 60 * 60 * 1000;
    } else if (normalizedRange === "30d") {
        startAt = now - 30 * 24 * 60 * 60 * 1000;
    }

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
        listDocuments("teams", [Query.limit(1)]),
        listDocuments("games", [Query.limit(1)]),
        listDocuments("attendance", [
            Query.equal("status", "accepted"),
            Query.limit(1),
        ]),
        listDocuments("attendance", [
            Query.equal("status", "declined"),
            Query.limit(1),
        ]),
        listDocuments("attendance", [
            Query.equal("status", "tentative"),
            Query.limit(1),
        ]),
        listDocuments("games", [Query.orderDesc("gameDate"), Query.limit(100)]),
    ]);

    let umamiStats = null;
    let umamiActive = null;
    let pageMetrics = [];
    let eventMetrics = [];

    try {
        [umamiStats, umamiActive, pageMetrics, eventMetrics] =
            await Promise.all([
                umamiService.getStats(startAt),
                umamiService.getActiveUsers(),
                umamiService.getMetrics("url", startAt),
                umamiService.getMetrics("event", startAt),
            ]);
    } catch (error) {
        // Umami is optional; if it is not configured or fails, continue without analytics.
        console.warn("Umami service failed to fetch data:", error.message);
    }

    // 2. Process Activity Metrics for teams and features
    const teamMetrics = (pageMetrics || [])
        .filter((record) => record.x.startsWith("/team/"))
        .map((record) => {
            // Extract teamId from /team/{teamId} or /team/{teamId}/lineup
            const teamId = record.x.split("/")[2];
            return { teamId, views: record.y };
        });

    // Aggregate views by teamId
    const aggregatedTeamViews = teamMetrics.reduce((acc, curr) => {
        acc[curr.teamId] = (acc[curr.teamId] || 0) + curr.views;
        return acc;
    }, {});

    // Feature Popularity mapping
    const featureViews = (pageMetrics || []).reduce((acc, record) => {
        const url = record.x;
        let featureName = "Other";

        if (url.includes("/gameday")) featureName = "Live Scoring";
        else if (url.includes("/lineup")) featureName = "Lineup Generator";
        else if (url.startsWith("/team/")) featureName = "Team Dashboard";
        else if (url.startsWith("/events/")) featureName = "Game Details";
        else if (url.startsWith("/user/")) featureName = "User Profile";
        else if (url.includes("settings")) featureName = "User Settings";
        else if (url.includes("dashboard")) featureName = "Home Dashboard";
        else if (url === "/" || url === "/landing")
            featureName = "Landing Page";
        else if (
            url.includes("login") ||
            url.includes("register") ||
            url.includes("forgot")
        )
            featureName = "Auth";

        acc[featureName] = (acc[featureName] || 0) + record.y;
        return acc;
    }, {});

    const topFeatures = Object.keys(featureViews)
        .map((name) => ({ name, views: featureViews[name] }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    // 3. Process activity for teams and parks
    const topTeamIds = Object.keys(aggregatedTeamViews)
        .sort((a, b) => aggregatedTeamViews[b] - aggregatedTeamViews[a])
        .slice(0, 5);

    let activeTeams = [];
    if (topTeamIds.length > 0) {
        const resolvedTeams = await listDocuments("teams", [
            Query.equal("$id", topTeamIds),
        ]);

        activeTeams = topTeamIds
            .map((id) => {
                const team = resolvedTeams.rows.find((t) => t.$id === id);
                return {
                    id,
                    name: team?.name || "Unknown Team",
                    primaryColor: team?.primaryColor,
                    views: aggregatedTeamViews[id],
                };
            })
            .filter((t) => t.name !== "Unknown Team");
    }

    // Park Popularity - Fallback to Season parkId if game parkId is missing
    const games = recentGames.rows || [];
    const seasonIds = [
        ...new Set(games.map((g) => g.seasonId).filter(Boolean)),
    ];

    let seasonMap = {};
    if (seasonIds.length > 0) {
        const resolvedSeasons = await listDocuments("seasons", [
            Query.equal("$id", seasonIds),
        ]);
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
        const resolvedParks = await listDocuments("parks", [
            Query.equal("$id", topParkIds),
        ]);

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
        .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt))
        .slice(0, 25);

    // 5. Process AI Lineup Metrics from Umami events
    const requested =
        eventMetrics?.find((e) => e.x === "ai-lineup-requested")?.y || 0;
    const generated =
        eventMetrics?.find((e) => e.x === "ai-lineup-generated")?.y || 0;
    const applied =
        eventMetrics?.find((e) => e.x === "ai-lineup-applied")?.y || 0;

    const aiLineupMetrics = {
        requested,
        generated,
        applied,
        // Overall success: how many requested lineups were ultimately applied
        successRate:
            requested > 0
                ? Math.min(
                      100,
                      Math.max(0, Math.round((applied / requested) * 100)),
                  )
                : 0,
        // Application rate: of generated lineups, how many were applied
        applicationRate:
            generated > 0
                ? Math.min(
                      100,
                      Math.max(0, Math.round((applied / generated) * 100)),
                  )
                : 0,
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
            umami: umamiStats,
            activeUsers: umamiActive?.visitors ?? umamiActive?.length ?? 0,
        },
        recentUsers,
        activeUsers: activeUsersList,
        activeTeams,
        activeParks,
        topFeatures,
        aiLineupMetrics,
        range: normalizedRange,
    };
}
