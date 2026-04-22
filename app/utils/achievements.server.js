import { readDocument } from "./databases";

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
        // Fetch each base achievement individually as querying by $id
        // in TablesDB listRows may not return results for all users.
        const achievementPromises = achievementIds.map((id) =>
            readDocument("achievements", id, [], client).catch(() => null),
        );
        const baseRows = (await Promise.all(achievementPromises)).filter(
            (a) => a !== null,
        );
        baseMap = new Map(baseRows.map((a) => [a.$id, a]));
    }

    return uaRows.map((ua) => ({
        ...ua,
        achievement: baseMap.get(ua.achievementId) || null,
    }));
}
