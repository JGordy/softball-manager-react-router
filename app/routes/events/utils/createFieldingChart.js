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
                assignedPlayer: player.lastName,
                assignedPosition: preferredPosition,
            };
        }
    }

    // Fallback if no preferred position is available
    if (availablePositions.length > 0) {
        const fallbackPosition = availablePositions[0];
        player.positions.push(fallbackPosition);
        return {
            assignedPlayer: player.lastName,
            assignedPosition: fallbackPosition,
        };
    }

    return { assignedPlayer: player.lastName, assignedPosition: null };
};

export default function createFieldingChart(players, innings = 7) {
    const numPlayers = players.length;
    const numPositions = positions.length;
    let MAX_OUTS;

    if (numPlayers <= numPositions) {
        MAX_OUTS = 0;
    } else {
        const totalOutSlots = (numPlayers - numPositions) * innings;
        MAX_OUTS = Math.ceil(totalOutSlots / numPlayers);
    }

    // NOTE: We don't want all of the player data to be duplicated, so we create a copy of the players array with the relevant values
    // This allows us to modify the positions without affecting the original player data.
    const playersCopy = [
        ...players.map((player) => ({
            $id: player.$id,
            firstName: player.firstName,
            lastName: player.lastName,
            gender: player.gender,
            preferredPositions: player.preferredPositions || [],
            dislikedPositions: player.dislikedPositions || [],
            positions: player?.positions || [],
        })),
    ];

    // Loop through the number of innings
    for (let inning = 0; inning < innings; inning++) {
        let assignedPlayers = [];
        let availablePositions = [...positions];
        let outPreviousInning;

        // Do this only if it's not the first inning
        if (inning !== 0) {
            // Find players out in the previous inning or who have met the max number of outs
            outPreviousInning = playersCopy.filter(
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
                    !assignedPlayers.includes(player.lastName),
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
                    assignedPlayers.includes(player.lastName) ||
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
            (player) => !assignedPlayers.includes(player.lastName),
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
