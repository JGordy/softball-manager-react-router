/**
 * Bad Words API utility
 * Detects and censors profanity in text
 * https://apilayer.com/marketplace/bad_words-api
 */

const BAD_WORDS_API_KEY = process.env.BAD_WORDS_API_KEY;
const BAD_WORDS_API_URL = "https://api.apilayer.com/bad_words";

if (!BAD_WORDS_API_KEY) {
    console.warn(
        "BAD_WORDS_API_KEY is not set. Bad words filtering will not work.",
    );
}

/**
 * Check text for bad words and optionally censor them
 * @param {string} text - The text to check for profanity
 * @param {object} options - Configuration options
 * @param {string} options.censorCharacter - Character to use for censoring (default: "*")
 * @returns {Promise<{bad_words_total: number, bad_words_list: Array, censored_content: string, content: string}>}
 */
export async function checkBadWords(text, options = {}) {
    if (!BAD_WORDS_API_KEY) {
        throw new Error(
            "BAD_WORDS_API_KEY environment variable is not configured",
        );
    }

    if (!text || typeof text !== "string") {
        throw new Error("Text parameter is required and must be a string");
    }

    const { censorCharacter = "*" } = options;

    try {
        const response = await fetch(
            `${BAD_WORDS_API_URL}?censor_character=${encodeURIComponent(censorCharacter)}`,
            {
                method: "POST",
                headers: {
                    apikey: BAD_WORDS_API_KEY,
                    "Content-Type": "text/plain",
                },
                body: text,
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Bad Words API error (${response.status}): ${errorText}`,
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error checking bad words:", error);
        throw error;
    }
}

/**
 * Check if text contains bad words (returns boolean)
 * @param {string} text - The text to check
 * @returns {Promise<boolean>} - True if bad words are found
 */
export async function hasBadWords(text) {
    try {
        const result = await checkBadWords(text);
        return result.bad_words_total > 0;
    } catch (error) {
        console.error("Error in hasBadWords:", error);
        // Return false on error to prevent blocking content submission
        return false;
    }
}

/**
 * Censor bad words in text
 * @param {string} text - The text to censor
 * @param {string} censorCharacter - Character to use for censoring (default: "*")
 * @returns {Promise<string>} - The censored text
 */
export async function censorBadWords(text, censorCharacter = "*") {
    try {
        const result = await checkBadWords(text, { censorCharacter });
        return result.censored_content || text;
    } catch (error) {
        console.error("Error censoring bad words:", error);
        // Return original text on error
        return text;
    }
}

/**
 * Get list of bad words found in text
 * @param {string} text - The text to analyze
 * @returns {Promise<Array<{original: string, word: string, start: number, end: number, replacedLen: number}>}>
 */
export async function getBadWordsList(text) {
    try {
        const result = await checkBadWords(text);
        return result.bad_words_list || [];
    } catch (error) {
        console.error("Error getting bad words list:", error);
        return [];
    }
}
