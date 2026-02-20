import { Query } from "node-appwrite";
import { listDocuments } from "@/utils/databases";
import { umamiService } from "@/utils/umami/server";

export async function getAdminDashboardData({ users }) {
    // 1. Fetch Appwrite Stats & metrics in parallel
    const [allUsers, allTeams, allGames] = await Promise.all([
        users.list([Query.limit(1)]),
        listDocuments("teams", [Query.limit(1)]),
        listDocuments("games", [Query.limit(1)]),
    ]);

    let umamiStats = null;
    let umamiActive = null;
    let pageMetrics = [];

    try {
        [umamiStats, umamiActive, pageMetrics] = await Promise.all([
            umamiService.getStats(),
            umamiService.getActiveUsers(),
            umamiService.getMetrics("url"),
        ]);
    } catch (error) {
        // Umami is optional; if it is not configured or fails, continue without analytics.
        console.warn("Umami service failed to fetch data:", error.message);
    }

    // 2. Process Activity Metrics for teams
    const teamMetrics = (pageMetrics || [])
        .filter((record) => record.x.startsWith("/team/"))
        .map((record) => {
            // Extract teamId from /team/{teamId} or /team/{teamId}/lineup
            const teamId = record.x.split("/")[2];
            return { teamId, views: record.y };
        });

    // Aggregate views by teamId (in case of multiple URLs like /lineup)
    const aggregatedTeamViews = teamMetrics.reduce((acc, curr) => {
        acc[curr.teamId] = (acc[curr.teamId] || 0) + curr.views;
        return acc;
    }, {});

    // Get top teams by views
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

    // 3. Get some recent and active users for the dashboard
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

    return {
        stats: {
            totalUsers: allUsers.total,
            totalTeams: allTeams.total,
            totalGames: allGames.total,
            umami: umamiStats,
            activeUsers: umamiActive?.visitors ?? umamiActive?.length ?? 0,
        },
        recentUsers,
        activeUsers: activeUsersList,
        activeTeams,
    };
}
