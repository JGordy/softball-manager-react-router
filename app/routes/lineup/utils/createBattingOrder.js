/**
 * Creates a batting order from available players.
 *
 * @param {Array} players - Array of player objects with $id, gender, etc.
 * @param {Object} options - Configuration options
 * @param {string|Array} options.idealLineup - JSON string or array of player IDs in preferred order (from team settings)
 * @param {number} options.maxConsecutiveMales - Maximum consecutive male batters allowed (default: 3)
 * @param {string} options.lineupStrategy - "best_first" or "spread" (default: "spread")
 * @param {Object} options.playerLabels - Map of playerId -> array of labels (e.g. ["Power", "On Base"])
 * @returns {Array} - Ordered array of players for the batting lineup
 */
function createBattingOrder(players, options = {}) {
    const {
        idealLineup,
        maxConsecutiveMales = 3,
        lineupStrategy = "spread",
        playerLabels = {},
    } = options;

    // Parse idealLineup if provided as a string
    let idealOrder = [];
    if (idealLineup) {
        try {
            const parsed =
                typeof idealLineup === "string"
                    ? JSON.parse(idealLineup)
                    : idealLineup;

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                const l = Array.isArray(parsed.lineup) ? parsed.lineup : [];
                const r = Array.isArray(parsed.reserves) ? parsed.reserves : [];
                idealOrder = [...l, ...r];
            }
        } catch (e) {
            console.error("Error parsing idealLineup:", e);
        }
    }

    // If we have an ideal lineup from team settings, use it as primary ordering
    if (idealOrder.length > 0) {
        return createBattingOrderFromIdeal(
            players,
            idealOrder,
            maxConsecutiveMales,
            playerLabels,
            lineupStrategy,
        );
    }

    // Fall back to original algorithm if no ideal lineup is set
    return createBattingOrderFallback(
        players,
        maxConsecutiveMales,
        playerLabels,
        lineupStrategy,
    );
}

/**
 * Creates batting order based on team's ideal lineup, filtering to only available players.
 * Falls back to adding remaining players using the gender-balancing algorithm.
 */
function createBattingOrderFromIdeal(
    players,
    idealOrder,
    maxConsecutiveMales,
    playerLabels,
    lineupStrategy,
) {
    const battingOrder = [];
    const playerMap = new Map(players.map((p) => [p.$id, p]));
    const addedPlayerIds = new Set();

    // First, add players in ideal order (only those who are available)
    for (const playerId of idealOrder) {
        const player = playerMap.get(playerId);
        if (player && !addedPlayerIds.has(playerId)) {
            battingOrder.push(player);
            addedPlayerIds.add(playerId);
        }
    }

    // Get remaining players not in the ideal order
    const remainingPlayers = players.filter((p) => !addedPlayerIds.has(p.$id));

    // Add remaining players using the gender-balancing fallback
    if (remainingPlayers.length > 0) {
        const additionalOrder = createBattingOrderFallback(
            remainingPlayers,
            maxConsecutiveMales,
            playerLabels,
            lineupStrategy,
        );
        battingOrder.push(...additionalOrder);
    }

    return battingOrder;
}

/**
 * Algorithm: Creates batting order with gender balancing and labels
 */
function createBattingOrderFallback(
    players,
    maxConsecutiveMales,
    playerLabels = {},
    lineupStrategy = "spread",
) {
    // Assign a label score to each player: Power = 3, On Base = 2, Other = 1
    const scoredPlayers = players.map((p) => {
        const labels = playerLabels[p.$id] || [];
        let score = 1;
        if (labels.includes("Power")) score = 3;
        else if (labels.includes("On Base")) score = 2;
        return { ...p, _labelScore: score };
    });

    let prioritizedQueue = [];

    if (lineupStrategy === "best_first") {
        // Sort purely descending by score
        prioritizedQueue = scoredPlayers.sort(
            (a, b) => b._labelScore - a._labelScore,
        );
    } else {
        // Spread Strategy: Interleave the top hitters throughout the lineup
        const power = scoredPlayers.filter((p) => p._labelScore === 3);
        const onBase = scoredPlayers.filter((p) => p._labelScore === 2);
        const other = scoredPlayers.filter((p) => p._labelScore === 1);

        // A simple spreading approach:
        // We have N total spots. We just take one from power, one from other, one from onBase, etc.
        while (power.length > 0 || onBase.length > 0 || other.length > 0) {
            if (power.length > 0) prioritizedQueue.push(power.shift());
            if (other.length > 0) prioritizedQueue.push(other.shift());
            if (onBase.length > 0) prioritizedQueue.push(onBase.shift());
            if (other.length > 0) prioritizedQueue.push(other.shift()); // Spread 'other' more frequently
        }
    }

    const availablePlayers = [...prioritizedQueue];
    const battingOrder = [];
    let consecutiveMaleCount = 0;

    // Continue until all players are in the batting order
    while (availablePlayers.length > 0) {
        let playerIndexToPick = -1;

        // If we've reached the max consecutive males, we MUST pick a female.
        if (consecutiveMaleCount >= maxConsecutiveMales) {
            playerIndexToPick = availablePlayers.findIndex(
                (p) => p.gender === "Female",
            );

            // If no female is available, fallback to picking the highest priority player
            if (playerIndexToPick === -1) {
                playerIndexToPick = 0;
            }
        } else {
            // Pick the highest priority player (index 0)
            playerIndexToPick = 0;

            // Look ahead: if picking a male now would force us into an impossible situation later?
            // (A more advanced algorithm could look ahead, but for now we trust the queue order
            // until we are forced to pick a female).
        }

        const playerToPick = availablePlayers.splice(playerIndexToPick, 1)[0];

        // Remove the temporary _labelScore property
        delete playerToPick._labelScore;

        battingOrder.push(playerToPick);

        if (playerToPick.gender === "Male") {
            consecutiveMaleCount++;
        } else {
            consecutiveMaleCount = 0;
        }
    }

    return battingOrder;
}

export default createBattingOrder;
