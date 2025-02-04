function createBattingOrder(players) {
    // Sort players by batting rating in descending order
    const sortedPlayers = [...players].sort((a, b) => b.battingRating - a.battingRating);
    const battingOrder = [];
    let lastGender = null;
    let consecutiveMaleCount = 0;

    while (sortedPlayers.length > 0) {
        const currentPlayer = sortedPlayers.shift();

        if (currentPlayer.gender === 'male') {
            consecutiveMaleCount++;
        } else {
            consecutiveMaleCount = 0;
        }

        if (consecutiveMaleCount >= 2) {
            // If two male batters have occurred consecutively, find a female player to insert
            const femalePlayerIndex = sortedPlayers.findIndex(p => p.gender === 'female');
            if (femalePlayerIndex !== -1) {
                battingOrder.push(sortedPlayers.splice(femalePlayerIndex, 1)[0]);
                consecutiveMaleCount = 0; // Reset consecutive male count
            }
        }

        battingOrder.push(currentPlayer);
        lastGender = currentPlayer.gender;
    }

    return battingOrder;
}

export default createBattingOrder;