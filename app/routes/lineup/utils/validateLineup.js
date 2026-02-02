import fieldingPositions from "@/constants/positions";
import { getOrdinal } from "./formatters";

export const validateLineup = (lineup, team) => {
    const battingErrors = [];
    const fieldingErrors = {};
    const summary = [];

    if (!lineup || lineup.length === 0) {
        return { battingErrors, fieldingErrors, summary };
    }

    // 1. Batting Order Validation
    const maxConsecutiveMales = parseInt(team?.prefs?.maxMaleBatters, 10) || 0;

    if (maxConsecutiveMales > 0) {
        let consecutiveMales = 0;
        lineup.forEach((player, index) => {
            if (player.gender === "Male") {
                consecutiveMales++;
            } else {
                consecutiveMales = 0;
            }

            if (consecutiveMales > maxConsecutiveMales) {
                const error = {
                    playerId: player.$id,
                    playerName: `${player.firstName} ${player.lastName}`,
                    count: consecutiveMales,
                    message: `More than ${maxConsecutiveMales} consecutive male batters (${consecutiveMales} in a row)`,
                };
                battingErrors.push(error);
                summary.push(
                    `Batting Order: ${player.firstName} ${player.lastName} is the ${getOrdinal(consecutiveMales)} consecutive male batter.`,
                );
            }
        });
    }

    // 2. Fielding Validation
    const inningsCount = 7;
    const requiredPositions = Object.keys(fieldingPositions);

    for (let i = 0; i < inningsCount; i++) {
        const inningIndex = i;
        const inningNum = i + 1;
        const positionsInInning = {};

        // Check for duplicates
        lineup.forEach((player) => {
            const position = player.positions[inningIndex];
            if (position && position !== "Out") {
                if (!positionsInInning[position]) {
                    positionsInInning[position] = [];
                }
                positionsInInning[position].push(player);
            }
        });

        const duplicates = [];
        Object.entries(positionsInInning).forEach(([position, players]) => {
            if (players.length > 1) {
                const playerNames = players
                    .map((p) => `${p.firstName} ${p.lastName}`)
                    .join(" and ");
                duplicates.push({
                    position,
                    players: players.map((p) => p.$id),
                    playerNames: players.map(
                        (p) => `${p.firstName} ${p.lastName}`,
                    ),
                    message: `${position} is assigned to multiple players`,
                });
                summary.push(
                    `Inning ${inningNum}: ${position} is assigned to ${playerNames}.`,
                );
            }
        });

        // Check for missing positions
        const missing = requiredPositions.filter(
            (pos) => !positionsInInning[pos],
        );

        let reportedMissing = [];
        if (missing.length > 0) {
            if (missing.length < requiredPositions.length) {
                summary.push(
                    `Inning ${inningNum}: Missing ${missing.join(", ")}.`,
                );
                reportedMissing = missing;
            } else if (lineup.some((p) => p.positions[inningIndex])) {
                summary.push(
                    `Inning ${inningNum}: Missing all field positions.`,
                );
                reportedMissing = missing;
            }
        }

        fieldingErrors[`inning${inningNum}`] = {
            duplicates,
            missing: reportedMissing,
        };
    }

    return { battingErrors, fieldingErrors, summary };
};
