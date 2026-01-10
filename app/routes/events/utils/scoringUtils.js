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

export function getEventDescription(actionType, batterName, position) {
    if (actionType === "1B") return `${batterName} singles to ${position}`;
    if (actionType === "2B") return `${batterName} doubles to ${position}`;
    if (actionType === "3B") return `${batterName} triples to ${position}`;
    if (actionType === "HR")
        return `${batterName} hits a home run to ${position}`;
    if (actionType === "Ground Out")
        return `${batterName} grounds out to ${position}`;
    if (actionType === "Fly Out")
        return `${batterName} flies out to ${position}`;
    if (actionType === "Line Out")
        return `${batterName} lines out to ${position}`;
    if (actionType === "Pop Out")
        return `${batterName} pops out to ${position}`;
    if (actionType === "E")
        return `${batterName} reaches on an error by ${position}`;
    if (actionType === "FC")
        return `${batterName} reaches on a fielder's choice to ${position}`;
    if (actionType === "BB") return `${batterName} walks`;
    if (actionType === "K") return `${batterName} strikes out`;

    return `${batterName}: ${actionType}${position ? ` (${position})` : ""}`;
}

/**
 * Handles walk events with correct forced runner advancement logic.
 * A walk forces all runners to advance only if there's a force play.
 * Returns updated base state with player IDs for runners and any who scored.
 */
export function handleWalk(runners, batterId) {
    const { first: r1, second: r2, third: r3 } = runners;
    const scoredIds = [];
    let runsOnPlay = 0;

    // Runner on third scores only if all bases were occupied (forced home)
    if (r1 && r2 && r3) {
        runsOnPlay++;
        scoredIds.push(r3);
    }

    // Walk logic: Batter to 1st, force runners only if necessary
    const newRunners = {
        first: batterId,
        second: r1 ? r1 : r2, // If R1 exists, they're forced to 2nd. Else R2 stays.
        third: r1 && r2 ? r2 : r3, // If both R1 and R2 exist, R2 is forced to 3rd. Else R3 stays.
        scored: scoredIds,
    };

    return { newRunners, runsOnPlay, outsRecorded: 0 };
}

/**
 * Handles events where the drawer provides manual runner results.
 * Used for hits, errors, and batted outs with runners.
 */
export function handleRunnerResults(runnerResults, runners, batterId) {
    let newRunners = { first: null, second: null, third: null, scored: [] };
    let runsOnPlay = 0;
    let outsRecorded = 0;

    const processRunner = (result, runnerId) => {
        if (!result || !runnerId) return;

        if (result === "score") {
            runsOnPlay++;
            newRunners.scored.push(runnerId);
        } else if (result === "out") {
            outsRecorded++;
        } else if (["first", "second", "third"].includes(result)) {
            newRunners[result] = runnerId;
        }
    };

    // Process Batter
    processRunner(runnerResults.batter, batterId);

    // Process Runners
    ["first", "second", "third"].forEach((base) => {
        if (runners[base]) {
            const result = runnerResults[base];
            if (result === "stay") {
                newRunners[base] = runners[base];
            } else {
                processRunner(result, runners[base]);
            }
        }
    });

    return { newRunners, runsOnPlay, outsRecorded };
}
