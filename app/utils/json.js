/**
 * Attempts to parse a partial JSON string that is expected to have the structure:
 * { "lineup": [ ... ] }
 *
 * It finds the last complete object in the "lineup" array by scanning token-aware,
 * closes the array and object, and parses it.
 *
 * @param {string} jsonStr - The incomplete JSON string
 * @returns {Array|null} The partial lineup array or null if parsing fails
 */
export function tryParsePartialLineup(jsonStr) {
    if (!jsonStr) return null;

    // Check if we have the start of "lineup" to avoid parsing unrelated JSON
    const lineupMatch = jsonStr.match(/"lineup"\s*:\s*\[/);
    if (!lineupMatch) return null;

    const startIndex = lineupMatch.index;

    // Find the last closing brace "}" that is NOT inside a string.
    // We scan from the start of "lineup" to be efficient.
    let inString = false;
    let lastBraceIndex = -1;
    let escapes = 0;

    for (let i = startIndex; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (inString) {
            if (char === '"' && escapes % 2 === 0) {
                inString = false;
            }
            // track backslashes to handle escaped quotes \"
            if (char === "\\") {
                escapes++;
            } else {
                escapes = 0;
            }
        } else {
            if (char === '"') {
                inString = true;
                escapes = 0;
            } else if (char === "}") {
                lastBraceIndex = i;
            }
        }
    }

    // If no object has been closed yet
    if (lastBraceIndex === -1) return null;

    // Extract everything up to the last closing brace
    const candidate = jsonStr.substring(0, lastBraceIndex + 1);

    // Try to close the array and the root object.
    // The candidate likely looks like: '{"lineup": [{...}, {...}'
    // We append ']}' to make it: '{"lineup": [{...}, {...}]}'
    try {
        const parsed = JSON.parse(candidate + "]}");
        if (Array.isArray(parsed.lineup)) {
            return parsed.lineup;
        }
    } catch (e) {
        // Parsing failed, likely because the structure wasn't exactly what we expected
        // or the cut-off point was awkward (though our brace logic minimizes this).
    }

    return null;
}
