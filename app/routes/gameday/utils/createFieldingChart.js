import fieldingPositions from "@constants/positions";

const positions = Object.keys(fieldingPositions);

// Add helper function to count "Out" positions
const countOutPositions = (player) => {
    return player.positions.filter((pos) => pos === "Out").length;
};

const assignPosition = (player, availablePositions) => {
    // 1. Prioritize Preferred Positions: Iterate through preferred positions FIRST.
    for (let preferredPosition of player.preferredPositions) {
        if (availablePositions.includes(preferredPosition)) {
            player.positions.push(preferredPosition);
            return {
                assignedPlayer: player.firstName + player.lastName,
                assignedPosition: preferredPosition,
            };
        }
    }

    // Fallback if no preferred position is available
    if (availablePositions.length > 0) {
        const fallbackPosition = availablePositions[0];
        player.positions.push(fallbackPosition);
        return {
            assignedPlayer: player.firstName + player.lastName,
            assignedPosition: fallbackPosition,
        };
    }

    return {
        assignedPlayer: player.firstName + player.lastName,
        assignedPosition: null,
    };
};

export default function createFieldingChart(players, innings = 7) {
    const MAX_OUTS = players.length > 13 ? 3 : 2;
    const playersCopy = [...players];

    // Loop through the number of innings
    for (let inning = 0; inning < innings; inning++) {
        let assignedPlayers = [];
        let availablePositions = [...positions];
        let outPreviousInning;

        // Do this only if it's not the first inning
        if (inning !== 0) {
            // Find players out in the previous inning or who have met the max number of outs
            outPreviousInning = players.filter(
                (player) =>
                    player.positions[inning - 1] === "Out" ||
                    countOutPositions(player) >= MAX_OUTS,
            );
        }

        if (outPreviousInning?.length > 0) {
            outPreviousInning.forEach((player) => {
                const { assignedPlayer, assignedPosition } = assignPosition(
                    player,
                    availablePositions,
                );
                assignedPlayers.push(assignedPlayer);
                // Remove assignPosition from availablePositions
                availablePositions = availablePositions.filter(
                    (pos) => pos !== assignedPosition,
                );
            });
        }

        const pitcherPosition = "Pitcher";
        if (availablePositions.includes(pitcherPosition)) {
            const eligiblePitchers = playersCopy.filter(
                (player) =>
                    player.preferredPositions.includes(pitcherPosition) &&
                    !assignedPlayers.includes(
                        player.firstName + player.lastName,
                    ),
            );

            if (eligiblePitchers.length > 0) {
                const pitcher = eligiblePitchers[0]; // Assign to the first eligible pitcher
                const { assignedPlayer, assignedPosition } = assignPosition(
                    pitcher,
                    [pitcherPosition],
                ); // Force pitcher position
                assignedPlayers.push(assignedPlayer);
                availablePositions = availablePositions.filter(
                    (pos) => pos !== assignedPosition,
                );
            }
        }

        availablePositions?.forEach((position) => {
            // Skip if no positions left to assign
            if (availablePositions.length === 0) return;

            playersCopy.forEach((player) => {
                // Skip if player already assigned or no positions available
                if (
                    assignedPlayers.includes(
                        player.firstName + player.lastName,
                    ) ||
                    availablePositions.length === 0
                )
                    return;

                if (player.preferredPositions.includes(position)) {
                    const { assignedPlayer, assignedPosition } = assignPosition(
                        player,
                        availablePositions,
                    );
                    // Only process successful assignments
                    if (assignedPosition) {
                        assignedPlayers.push(assignedPlayer);
                        availablePositions = availablePositions.filter(
                            (pos) => pos !== assignedPosition,
                        );
                    }
                }
            });
        });

        // Find players not assigned a position this inning

        // Get list of unassigned players
        const unassignedPlayers = playersCopy.filter(
            (player) =>
                !assignedPlayers.includes(player.firstName + player.lastName),
        );

        // Sort unassigned players by number of "Out" positions (ascending)
        unassignedPlayers.sort(
            (a, b) => countOutPositions(a) - countOutPositions(b),
        );

        // Assign "Out" to players with fewer than MAX_OUTS
        unassignedPlayers.forEach((player) => {
            if (countOutPositions(player) < MAX_OUTS) {
                player.positions.push("Out");
            } else {
                // Try to find another position or handle this case
                const { assignedPlayer, assignedPosition } = assignPosition(
                    player,
                    availablePositions,
                );
                if (assignedPosition) {
                    assignedPlayers.push(assignedPlayer);
                    availablePositions = availablePositions.filter(
                        (pos) => pos !== assignedPosition,
                    );
                }
            }
        });
    }

    return playersCopy;
}
