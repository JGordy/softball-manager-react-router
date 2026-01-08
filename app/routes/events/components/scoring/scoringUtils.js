export function getRunnerMovement(baseState, playerChart) {
    if (!baseState || !playerChart) return [];

    const movements = [];

    try {
        const state =
            typeof baseState === "string" ? JSON.parse(baseState) : baseState;

        // Helper to get player name by ID
        const getPlayerName = (playerId) => {
            const player = playerChart.find((p) => p.$id === playerId);
            return player
                ? `${player.firstName} ${player.lastName.charAt(0)}.`
                : "Runner";
        };

        // First, show who scored
        if (
            state.scored &&
            Array.isArray(state.scored) &&
            state.scored.length > 0
        ) {
            state.scored.forEach((playerId) => {
                movements.push(`${getPlayerName(playerId)} scores`);
            });
        }

        // Then show the resulting base state (who's on base now)
        const baseOccupants = [];
        if (state.first)
            baseOccupants.push(`1B: ${getPlayerName(state.first)}`);
        if (state.second)
            baseOccupants.push(`2B: ${getPlayerName(state.second)}`);
        if (state.third)
            baseOccupants.push(`3B: ${getPlayerName(state.third)}`);

        if (baseOccupants.length > 0) {
            movements.push(baseOccupants.join(", "));
        }
    } catch (e) {
        console.warn("Failed to parse baseState for runner movement", e);
    }

    return movements;
}
