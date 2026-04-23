import { Query } from "node-appwrite";
import { listDocuments } from "./databases";

/**
 * Joins user_achievement rows with their corresponding base achievement documents.
 *
 * @param {Array} uaRows - List of user_achievement documents
 * @param {Object} client - Appwrite client
 * @returns {Promise<Array>} List of user_achievements with nested achievement data
 */
export async function joinAchievements(uaRows = [], client) {
    if (uaRows.length === 0) return [];

    let baseMap = new Map();
    const hasAchievementIds = uaRows.some((ua) => ua.achievementId);

    if (hasAchievementIds) {
        // Fetch all base achievements (only 26 total) to avoid problematic $id filters
        // or expensive individual row lookups in the TablesDB environment.
        const result = await listDocuments(
            "achievements",
            [Query.limit(500)],
            client,
        );

        const baseRows = result.rows || [];
        baseMap = new Map(baseRows.map((a) => [a.$id, a]));
    }

    return uaRows.map((ua) => ({
        ...ua,
        achievement: baseMap.get(ua.achievementId) || null,
    }));
}
