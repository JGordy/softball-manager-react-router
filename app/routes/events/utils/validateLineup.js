import fieldingPositions from "@/constants/positions";

export const validateLineup = (lineup, team) => {
    const battingErrors = [];
    const fieldingErrors = {};
    const summary = [];

    if (!lineup || lineup.length === 0) {
        return { battingErrors, fieldingErrors, summary };
    }

    // Helper for ordinal numbers (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinal = (number) => {
        const lastTwoDigits = number % 100;
        // Handle 11th, 12th, 13th as special cases
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return number + "th";
        }
        const lastDigit = number % 10;
        const suffixes = ["th", "st", "nd", "rd"];
        return number + (suffixes[lastDigit] || "th");
    };

    // 1. Batting Order Validation (Max 3 males in a row) - Only for Coed teams
    if (team?.genderMix === "Coed") {
        let consecutiveMales = 0;
        lineup.forEach((player, index) => {
            if (player.gender === "Male") {
                consecutiveMales++;
            } else {
                consecutiveMales = 0;
            }

            if (consecutiveMales > 3) {
                const error = {
                    playerId: player.$id,
                    playerName: `${player.firstName} ${player.lastName}`,
                    count: consecutiveMales,
                    message: `More than 3 consecutive male batters (${consecutiveMales} in a row)`,
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
