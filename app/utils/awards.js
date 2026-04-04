/**
 * Utility to calculate winners for a specific award based on votes.
 * Handles ties and returns an array of winner user IDs and the tally map.
 *
 * @param {Object} votes - The votes collection object (with rows/total)
 * @param {string} awardType - The type/reason of the award to calculate for
 * @returns {Object} result - { winnerIds: string[], maxVotes: number, tallies: Object }
 */
export function calculateWinners(votes, awardType) {
    if (!votes || !votes.rows || votes.rows.length === 0) {
        return { winnerIds: [], maxVotes: 0, tallies: Object.create(null) };
    }

    // Tally votes for the specific award
    const tallies = Object.create(null);
    votes.rows.forEach((v) => {
        if (v.reason !== awardType) return;
        const nominatedId = v.nominated_user_id || v.nominatedUserId; // Handle both camel and snake case
        if (!nominatedId) return;
        tallies[nominatedId] = (tallies[nominatedId] ?? 0) + 1;
    });

    const entries = Object.entries(tallies);
    if (entries.length === 0) {
        return { winnerIds: [], maxVotes: 0, tallies };
    }

    // Find the maximum vote count
    const maxVotes = Math.max(...entries.map(([, count]) => count));

    // Get all users who share the maximum count
    const winnerIds = entries
        .filter(([, count]) => count === maxVotes)
        .map(([id]) => id);

    return { winnerIds, maxVotes, tallies };
}

/**
 * Aggregates all votes in a single pass and identifies winners for every award type found.
 * Fixes O(awardTypes * votes) performance issue.
 *
 * @param {Object} votes - The votes collection object
 * @returns {Object} results - A map of { [awardType]: { winnerIds: string[], maxVotes: number } }
 */
export function calculateAllWinners(votes) {
    if (!votes || !votes.rows || votes.rows.length === 0) {
        return Object.create(null);
    }

    // 1. Single pass: Tally everyone by award type
    const awardTallies = Object.create(null); // { [awardType]: { [userId]: count } }
    votes.rows.forEach((v) => {
        const type = v.reason;
        if (!type) return;

        const nominatedId = v.nominated_user_id || v.nominatedUserId;
        if (!nominatedId) return;

        if (!awardTallies[type]) {
            awardTallies[type] = Object.create(null);
        }
        awardTallies[type][nominatedId] =
            (awardTallies[type][nominatedId] ?? 0) + 1;
    });

    // 2. Finalize winners for each type
    const finalResults = Object.create(null);
    for (const type in awardTallies) {
        const tallies = awardTallies[type];
        const entries = Object.entries(tallies);
        const maxVotes = Math.max(...entries.map(([, count]) => count));
        const winnerIds = entries
            .filter(([, count]) => count === maxVotes)
            .map(([id]) => id);

        finalResults[type] = { winnerIds, maxVotes };
    }

    return finalResults;
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

    // 2. Fallback: Single-pass dynamic calculation from votes
    if (awards?.total > 0 && votes?.rows) {
        const allResults = calculateAllWinners(votes);
        return Object.values(allResults).some((res) =>
            res.winnerIds.includes(userId),
        );
    }

    return false;
}
