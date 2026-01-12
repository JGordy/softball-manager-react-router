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

const BASE_RANKS = {
    out: 0,
    stay: 1,
    first: 2,
    second: 3,
    third: 4,
    score: 5,
};

const EXPECTED_BATTER_BASE = {
    "1B": "first",
    "2B": "second",
    "3B": "third",
    HR: "score",
    E: "first",
    FC: "first",
};

export function getEventDescription(
    actionType,
    batterName,
    position,
    runnerResults = null,
) {
    let baseDesc = "";
    if (actionType === "1B") baseDesc = `${batterName} singles to ${position}`;
    else if (actionType === "2B")
        baseDesc = `${batterName} doubles to ${position}`;
    else if (actionType === "3B")
        baseDesc = `${batterName} triples to ${position}`;
    else if (actionType === "HR")
        baseDesc = `${batterName} hits a home run to ${position}`;
    else if (actionType === "Ground Out")
        baseDesc = `${batterName} grounds out to ${position}`;
    else if (actionType === "Fly Out")
        baseDesc = `${batterName} flies out to ${position}`;
    else if (actionType === "Line Out")
        baseDesc = `${batterName} lines out to ${position}`;
    else if (actionType === "Pop Out")
        baseDesc = `${batterName} pops out to ${position}`;
    else if (actionType === "E")
        baseDesc = `${batterName} reaches on an error by ${position}`;
    else if (actionType === "FC")
        baseDesc = `${batterName} reaches on a fielder's choice to ${position}`;
    else if (actionType === "BB") baseDesc = `${batterName} walks`;
    else if (actionType === "K") baseDesc = `${batterName} strikes out`;
    else
        baseDesc = `${batterName}: ${actionType}${position ? ` (${position})` : ""}`;

    // Add advancement context if batter moved further than expected
    if (runnerResults?.batter && EXPECTED_BATTER_BASE[actionType]) {
        const actual = runnerResults.batter;
        const expected = EXPECTED_BATTER_BASE[actionType];

        if (BASE_RANKS[actual] > BASE_RANKS[expected]) {
            const advancement =
                actual === "score" ? "scores" : `advances to ${actual}`;

            // If it was already an error, just say "on the play", otherwise specify "on error"
            // per user request for hit advancement
            const context = ["E", "FC"].includes(actionType)
                ? "on the play"
                : "on error";
            baseDesc += ` and ${advancement} ${context}`;
        } else if (
            actual === "out" &&
            actionType !== "K" &&
            !actionType.includes("Out")
        ) {
            baseDesc += " and is out on the play";
        }
    }

    return baseDesc;
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
