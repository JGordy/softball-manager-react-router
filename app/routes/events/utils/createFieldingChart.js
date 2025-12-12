import fieldingPositions from "@/constants/positions";

const positions = Object.keys(fieldingPositions);

// Add helper function to count "Out" positions
const countOutPositions = (player) => {
    return player.positions.filter((pos) => pos === "Out").length;
};

/**
 * Gets the preferred positions for a player, prioritizing team-level idealPositioning
 * over player-level preferredPositions.
 *
 * @param {string} playerId - The player's ID
 * @param {Array} playerPreferredPositions - The player's individual preferred positions
 * @param {Object} idealPositioning - Team-level ideal positioning map (position -> [playerIds])
 * @returns {Array} - Ordered array of preferred positions for this player
 */
const getPreferredPositions = (
    playerId,
    playerPreferredPositions,
    idealPositioning,
) => {
    if (!idealPositioning || Object.keys(idealPositioning).length === 0) {
        return playerPreferredPositions || [];
    }

    // Find positions where this player is listed in the team's ideal positioning
    const teamPreferredPositions = [];
    for (const [position, playerIds] of Object.entries(idealPositioning)) {
        if (playerIds.includes(playerId)) {
            // Add with priority based on position in the array (lower index = higher priority)
            const priority = playerIds.indexOf(playerId);
            teamPreferredPositions.push({ position, priority });
        }
    }

    // Sort by priority (first choice players come first)
    teamPreferredPositions.sort((a, b) => a.priority - b.priority);

    // Extract just the position names
    const teamPositions = teamPreferredPositions.map((p) => p.position);

    // If team has preferences for this player, use those first, then fall back to player preferences
    if (teamPositions.length > 0) {
        // Combine team positions with player positions (team takes precedence)
        const combinedPositions = [...teamPositions];
        for (const pos of playerPreferredPositions || []) {
            if (!combinedPositions.includes(pos)) {
                combinedPositions.push(pos);
            }
        }
        return combinedPositions;
    }

    return playerPreferredPositions || [];
};

const assignPosition = (player, availablePositions, idealPositioning) => {
    // Get effective preferred positions (team-level takes precedence)
    const effectivePreferredPositions = getPreferredPositions(
        player.$id,
        player.preferredPositions,
        idealPositioning,
    );

    // 1. Prioritize Preferred Positions: Iterate through preferred positions FIRST.
    for (let preferredPosition of effectivePreferredPositions) {
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

/**
 * Creates a fielding chart for the given players across innings.
 *
 * @param {Array} players - Array of player objects with $id, preferredPositions, etc.
 * @param {Object} options - Configuration options
 * @param {number} options.innings - Number of innings (default: 7)
 * @param {string} options.idealPositioning - JSON string of position preferences from team settings
 * @returns {Array} - Array of players with positions array for each inning
 */
export default function createFieldingChart(players, options = {}) {
    const { innings = 7, idealPositioning } = options;

    // Parse idealPositioning if provided as a string
    let positioningMap = {};
    if (idealPositioning) {
        try {
            positioningMap =
                typeof idealPositioning === "string"
                    ? JSON.parse(idealPositioning)
                    : idealPositioning;
        } catch (e) {
            console.error("Error parsing idealPositioning:", e);
        }
    }

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
            positions: [...(player?.positions || [])], // Create a new array to avoid mutating original
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
                    positioningMap,
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
            // Find eligible pitchers using team's ideal positioning first
            let eligiblePitchers = [];

            if (
                positioningMap[pitcherPosition] &&
                positioningMap[pitcherPosition].length > 0
            ) {
                // Use team's preferred pitchers (in priority order)
                eligiblePitchers = positioningMap[pitcherPosition]
                    .map((id) =>
                        playersCopy.find(
                            (p) =>
                                p.$id === id &&
                                !assignedPlayers.includes(p.lastName),
                        ),
                    )
                    .filter(Boolean);
            }

            // Fall back to player's preferred positions
            if (eligiblePitchers.length === 0) {
                eligiblePitchers = playersCopy.filter(
                    (player) =>
                        player.preferredPositions.includes(pitcherPosition) &&
                        !assignedPlayers.includes(player.lastName),
                );
            }

            if (eligiblePitchers.length > 0) {
                const pitcher = eligiblePitchers[0]; // Assign to the first eligible pitcher
                const { assignedPlayer, assignedPosition } = assignPosition(
                    pitcher,
                    [pitcherPosition],
                    positioningMap,
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

            // First, try to assign based on team's ideal positioning
            if (
                positioningMap[position] &&
                positioningMap[position].length > 0
            ) {
                for (const playerId of positioningMap[position]) {
                    const player = playersCopy.find(
                        (p) =>
                            p.$id === playerId &&
                            !assignedPlayers.includes(p.lastName),
                    );
                    if (player && availablePositions.includes(position)) {
                        const { assignedPlayer, assignedPosition } =
                            assignPosition(player, [position], positioningMap);
                        if (assignedPosition) {
                            assignedPlayers.push(assignedPlayer);
                            availablePositions = availablePositions.filter(
                                (pos) => pos !== assignedPosition,
                            );
                            return; // Position filled, move to next
                        }
                    }
                }
            }

            // Fall back to player's preferred positions
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
                        positioningMap,
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

        // First, fill any remaining available positions with unassigned players
        // This ensures we fill the field before assigning "Out"
        for (const player of unassignedPlayers) {
            if (availablePositions.length === 0) break;

            const { assignedPlayer, assignedPosition } = assignPosition(
                player,
                availablePositions,
                positioningMap,
            );
            if (assignedPosition) {
                assignedPlayers.push(assignedPlayer);
                availablePositions = availablePositions.filter(
                    (pos) => pos !== assignedPosition,
                );
            }
        }

        // Re-filter unassigned players after filling positions
        const stillUnassigned = playersCopy.filter(
            (player) => !assignedPlayers.includes(player.lastName),
        );

        // Assign "Out" to remaining players with fewer than MAX_OUTS
        stillUnassigned.forEach((player) => {
            if (countOutPositions(player) < MAX_OUTS) {
                player.positions.push("Out");
            } else {
                // Player has maxed out their "Out" assignments but no positions available
                // This shouldn't happen with proper MAX_OUTS calculation, but handle gracefully
                player.positions.push("Out");
            }
        });
    }

    return playersCopy.map(
        ({ preferredPositions, dislikedPositions, ...rest }) => rest,
    );
}
