/**
 * Utility to calculate winners for a specific award based on votes.
 * Handles ties and returns an array of winner user IDs.
 *
 * @param {Object} votes - The votes collection object (with rows/total)
 * @param {string} awardType - The type/reason of the award to calculate for
 * @returns {Object} result - { winnerIds: string[], maxVotes: number }
 */
export function calculateWinners(votes, awardType) {
    if (!votes || !votes.rows || votes.rows.length === 0) {
        return { winnerIds: [], maxVotes: 0 };
    }

    // Tally votes for the specific award
    const tallies = {};
    votes.rows.forEach((v) => {
        if (v.reason !== awardType) return;
        const nominatedId = v.nominated_user_id || v.nominatedUserId; // Handle both camel and snake case
        if (!nominatedId) return;
        tallies[nominatedId] = (tallies[nominatedId] || 0) + 1;
    });

    const entries = Object.entries(tallies);
    if (entries.length === 0) {
        return { winnerIds: [], maxVotes: 0 };
    }

    // Find the maximum vote count
    const maxVotes = Math.max(...entries.map(([, count]) => count));

    // Get all users who share the maximum count
    const winnerIds = entries
        .filter(([, count]) => count === maxVotes)
        .map(([id]) => id);

    return { winnerIds, maxVotes };
}

/**
 * Checks if a specific user is a winner for ANY award in a game.
 * Uses both the awards collection and a dynamic calculation from votes as a fallback.
 *
 * @param {string} userId - The user ID to check
 * @param {Object} awards - The awards collection object
 * @param {Object} votes - The votes collection object
 * @returns {boolean} - True if the user is a winner or tied for a winner
 */
export function isUserAwardWinner(userId, awards, votes) {
    if (!userId) return false;

    // 1. Direct check against verified awards collection (Primary source)
    if (awards?.rows?.some((doc) => doc.winner_user_id === userId)) {
        return true;
    }

    // 2. Fallback: Dynamic calculation from votes for all award types
    // This is useful for recognizing ties where the awards collection might be incomplete.
    // We only do this if awards have been "finalized" (indicated by having at least one doc)
    if (awards?.total > 0 && votes?.rows) {
        const awardTypes = [...new Set(votes.rows.map((v) => v.reason))];
        return awardTypes.some((type) => {
            const { winnerIds } = calculateWinners(votes, type);
            return winnerIds.includes(userId);
        });
    }

    return false;
}
