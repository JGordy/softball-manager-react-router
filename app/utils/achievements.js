import { Query } from "node-appwrite";
import { listDocuments } from "./databases";

/**
 * Rarity weights for sorting and prioritization.
 * Higher values indicate greater rarity.
 */
export const RARITY_WEIGHTS = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
};

/**
 * Standardized sorting function for achievements.
 * Sorts by rarity first (descending), then by creation date (descending).
 * 
 * @param {Array} achievements - List of user_achievement documents (with joined achievement objects)
 * @returns {Array} Sorted achievement list
 */
export function sortAchievements(achievements = []) {
    return [...achievements].sort((a, b) => {
        const rarityA = a.achievement?.rarity?.toLowerCase() || "common";
        const rarityB = b.achievement?.rarity?.toLowerCase() || "common";

        const weightA = RARITY_WEIGHTS[rarityA] || 0;
        const weightB = RARITY_WEIGHTS[rarityB] || 0;

        // Sort by rarity first (highest first)
        if (weightA !== weightB) {
            return weightB - weightA;
        }

        // Then by date (newest first)
        const dateA = new Date(a.$createdAt || 0);
        const dateB = new Date(b.$createdAt || 0);
        return dateB - dateA;
    });
}

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
    const achievementIds = [...new Set(uaRows.map(ua => ua.achievementId).filter(Boolean))];
    let baseMap = new Map();
    
    if (achievementIds.length > 0) {
        // Fetch only the base achievements that are referenced
        const baseRows = await listDocuments("achievements", [Query.equal("$id", achievementIds)], client);
        baseMap = new Map((baseRows.rows || []).map(a => [a.$id, a]));
    }

    return uaRows.map(ua => ({
        ...ua,
        achievement: baseMap.get(ua.achievementId) || null
    }));
}
