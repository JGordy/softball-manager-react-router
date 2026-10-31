/**
 * Sanitize reasoning text to remove any database IDs that might have been included by the AI
 * @param {string} reasoning - The reasoning text from the AI
 * @returns {string} Sanitized reasoning text without database IDs
 */
export function sanitizeReasoning(reasoning) {
    if (!reasoning) return reasoning;

    // Remove patterns that look like Appwrite database IDs (fixed-length alphanumeric strings, ~20 chars)
    // Pattern: [ID: <id>] or ID: <id> or just standalone IDs
    return reasoning
        .replace(/\[ID:\s*[a-zA-Z0-9_-]{20}\]/g, "")
        .replace(/ID:\s*[a-zA-Z0-9_-]{20}\b/g, "")
        .replace(/\$id[:\s]*['"]*[a-zA-Z0-9_-]{20}['"]*\b/g, "")
        .trim();
}

/**
 * Validate and normalize the generated lineup
 * @param {Array} generatedLineup - The raw lineup array from AI
 * @param {Array} players - The original input players array
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.autoRepair=false] - Whether to auto-repair minor discrepancies (e.g. pad innings, append missing players)
 * @returns {Array} The validated and normalized lineup
 * @throws {Error} If validation fails and cannot be repaired
 */
export function validateLineup(
    generatedLineup,
    players = [],
    { autoRepair = false } = {},
) {
    // Validate the structure: must be a non-empty array
    if (!Array.isArray(generatedLineup) || generatedLineup.length === 0) {
        throw new Error("AI response does not match expected lineup format");
    }

    const inputPlayerMap = new Map((players || []).map((p) => [p.$id, p]));
    const inputPlayerIdSet = new Set(inputPlayerMap.keys());

    if (autoRepair) {
        const seenIds = new Set();
        const repairedLineup = [];

        for (let i = 0; i < generatedLineup.length; i++) {
            const rawPlayer = generatedLineup[i];
            if (!rawPlayer || !rawPlayer.$id) continue;

            const playerId = rawPlayer.$id;

            // Drop duplicates
            if (seenIds.has(playerId)) {
                console.warn(
                    `Duplicate player ID ${playerId} encountered; dropping duplicate.`,
                );
                continue;
            }

            // Drop unknown player IDs not in input roster
            const originalPlayer = inputPlayerMap.get(playerId);
            if (!originalPlayer && inputPlayerIdSet.size > 0) {
                console.warn(
                    `Unknown player ID ${playerId} not in input roster; skipping.`,
                );
                continue;
            }

            seenIds.add(playerId);

            // Normalize positions to exactly 7 items
            let positions = Array.isArray(rawPlayer.positions)
                ? [...rawPlayer.positions]
                : [];

            if (positions.length < 7) {
                while (positions.length < 7) {
                    positions.push("Out");
                }
            } else if (positions.length > 7) {
                positions = positions.slice(0, 7);
            }

            positions = positions.map((pos) =>
                typeof pos === "string" && pos.trim() ? pos.trim() : "Out",
            );

            repairedLineup.push({
                $id: playerId,
                firstName:
                    originalPlayer?.firstName || rawPlayer.firstName || "",
                lastName: originalPlayer?.lastName || rawPlayer.lastName || "",
                gender: originalPlayer?.gender || rawPlayer.gender || "",
                bats: originalPlayer?.bats || rawPlayer.bats || "",
                ...(rawPlayer.isAutoOut || playerId.startsWith("auto-out")
                    ? { isAutoOut: true }
                    : {}),
                positions,
            });
        }

        // Check for any input players missing from the generated lineup and append them
        for (const [id, originalPlayer] of inputPlayerMap.entries()) {
            if (!seenIds.has(id)) {
                console.warn(
                    `Player ${id} (${originalPlayer.firstName} ${originalPlayer.lastName}) was missing from AI output; appending to end of batting order with Out positions.`,
                );
                repairedLineup.push({
                    $id: id,
                    firstName: originalPlayer.firstName || "",
                    lastName: originalPlayer.lastName || "",
                    gender: originalPlayer.gender || "",
                    bats: originalPlayer.bats || "",
                    positions: Array(7).fill("Out"),
                });
            }
        }

        if (repairedLineup.length === 0) {
            throw new Error(
                "Generated lineup contains no valid players from the roster",
            );
        }

        return repairedLineup;
    }

    // Strict validation mode (default)
    // Warn (but do not fail) if the lineup length differs from the input players length
    if (generatedLineup.length !== players.length) {
        console.warn(
            "Generated lineup length differs from input players length",
            {
                expectedPlayers: players.length,
                generatedLineupLength: generatedLineup.length,
            },
        );
    }

    const validatedLineup = generatedLineup.map((player, index) => {
        if (
            !player ||
            !Array.isArray(player.positions) ||
            player.positions.length !== 7
        ) {
            const idInfo =
                player && player.$id
                    ? ` with id ${player.$id}`
                    : ` at index ${index}`;
            throw new Error(`Invalid positions array for player${idInfo}`);
        }
        return {
            $id: player.$id,
            firstName: player.firstName,
            lastName: player.lastName,
            gender: player.gender,
            bats: player.bats,
            ...(player.isAutoOut || player.$id?.startsWith("auto-out")
                ? { isAutoOut: true }
                : {}),
            positions: player.positions,
        };
    });

    // Validate that the generated lineup player IDs match the input player IDs
    const lineupPlayerIds = validatedLineup.map((p) => p.$id);
    const lineupPlayerIdSet = new Set(lineupPlayerIds);

    // Ensure there are no duplicate player IDs in the generated lineup
    if (lineupPlayerIds.length !== lineupPlayerIdSet.size) {
        throw new Error("Generated lineup contains duplicate player IDs");
    }

    // Ensure the lineup contains exactly the same player IDs as the input
    if (lineupPlayerIdSet.size !== inputPlayerIdSet.size) {
        throw new Error(
            "Generated lineup does not contain the same number of unique players as the input",
        );
    }

    for (const id of inputPlayerIdSet) {
        if (!lineupPlayerIdSet.has(id)) {
            throw new Error(`Generated lineup is missing player with id ${id}`);
        }
    }

    return validatedLineup;
}
