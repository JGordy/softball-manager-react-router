function createBattingOrder(players, maxConsecutiveMales = 3) {
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
