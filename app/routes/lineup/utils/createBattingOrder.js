/**
 * Creates a batting order from available players.
 *
 * @param {Array} players - Array of player objects with $id, gender, etc.
 * @param {Object} options - Configuration options
 * @param {string|Array} options.idealLineup - JSON string or array of player IDs in preferred order (from team settings)
 * @param {number} options.maxConsecutiveMales - Maximum consecutive male batters allowed (default: 3)
 * @returns {Array} - Ordered array of players for the batting lineup
 */
function createBattingOrder(players, options = {}) {
    const { idealLineup, maxConsecutiveMales = 3 } = options;

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
        );
    }

    // Fall back to original algorithm if no ideal lineup is set
    return createBattingOrderFallback(players, maxConsecutiveMales);
}

/**
 * Creates batting order based on team's ideal lineup, filtering to only available players.
 * Falls back to adding remaining players using the gender-balancing algorithm.
 */
function createBattingOrderFromIdeal(players, idealOrder, maxConsecutiveMales) {
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
        );
        battingOrder.push(...additionalOrder);
    }

    return battingOrder;
}

/**
 * Original algorithm: Creates batting order with gender balancing
 * (max consecutive males rule)
 */
function createBattingOrderFallback(players, maxConsecutiveMales) {
    const availablePlayers = [...players];
    const battingOrder = [];
    let consecutiveMaleCount = 0;

    // Continue until all players are in the batting order
    while (availablePlayers.length > 0) {
        let playerToPick = null;
        let playerIndexToPick;

        // If we've reached the max consecutive males, we MUST pick a female.
        if (consecutiveMaleCount >= maxConsecutiveMales) {
            // Find the highest-rated available female player.
            playerIndexToPick = availablePlayers.findIndex(
                (p) => p.gender === "Female",
            );

            // If no female is available, we have to pick a male, breaking the rule.
            // This is a fallback to prevent an infinite loop.
            if (playerIndexToPick === -1) {
                playerIndexToPick = 0; // Pick the highest-rated player (who must be male).
            }
        } else {
            // We can pick either gender. We'll just pick the highest-rated player available.
            playerIndexToPick = availablePlayers.findIndex(
                (p) => p.gender === "Male",
            );
        }

        // Get the player and remove them from the available list.
        playerToPick = availablePlayers.splice(playerIndexToPick, 1)[0];
        battingOrder.push(playerToPick);

        // Update the consecutive male count.
        if (playerToPick.gender === "Male") {
            consecutiveMaleCount++;
        } else {
            consecutiveMaleCount = 0;
        }
    }

    return battingOrder;
}

export default createBattingOrder;
