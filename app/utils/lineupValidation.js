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
 * @returns {Array} The validated and normalized lineup
 * @throws {Error} If validation fails
 */
export function validateLineup(generatedLineup, players) {
    // Validate the structure: must be a non-empty array
    if (!Array.isArray(generatedLineup) || generatedLineup.length === 0) {
        throw new Error("AI response does not match expected lineup format");
    }

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

    const validatedLineup = generatedLineup.map((player) => {
        if (!player.positions || player.positions.length !== 7) {
            throw new Error(`Invalid positions array for player ${player.$id}`);
        }
        return {
            $id: player.$id,
            firstName: player.firstName,
            lastName: player.lastName,
            gender: player.gender,
            bats: player.bats,
            positions: player.positions,
        };
    });

    // Validate that the generated lineup player IDs match the input player IDs
    const inputPlayerIdSet = new Set(players.map((p) => p.$id));
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

    for (const id of lineupPlayerIdSet) {
        if (!inputPlayerIdSet.has(id)) {
            throw new Error(
                `Generated lineup contains unknown player with id ${id}`,
            );
        }
    }

    return validatedLineup;
}
