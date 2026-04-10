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

    // Extract unique achievement IDs to fetch only what we need
    const achievementIds = [
        ...new Set(uaRows.map((ua) => ua.achievementId).filter(Boolean)),
    ];
    let baseMap = new Map();

    if (achievementIds.length > 0) {
        // Fetch only the base achievements that are referenced
        const baseRows = await listDocuments(
            "achievements",
            [Query.equal("$id", achievementIds)],
            client,
        );
        baseMap = new Map((baseRows.rows || []).map((a) => [a.$id, a]));
    }

    return uaRows.map((ua) => ({
        ...ua,
        achievement: baseMap.get(ua.achievementId) || null,
    }));
}
