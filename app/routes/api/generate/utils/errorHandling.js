/**
 * Extract a user-friendly error message from AI or system errors
 * without leaking sensitive database internals or raw stack traces.
 *
 * @param {Error|any} error - The error thrown
 * @returns {string} A user-friendly error message
 */
export function getFriendlyErrorMessage(error) {
    if (!error) return "Failed to generate lineup";
    const msg = error.message || String(error);

    if (
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("rate limit")
    ) {
        return "Failed to generate lineup: AI service rate limit reached. Please wait a minute and try again.";
    }

    if (
        msg.includes("503") ||
        msg.toLowerCase().includes("overloaded") ||
        msg.toLowerCase().includes("unavailable")
    ) {
        return "Failed to generate lineup: AI service is temporarily overloaded. Please try again in a few moments.";
    }

    if (
        msg.includes("401") ||
        msg.includes("403") ||
        msg.toLowerCase().includes("api key")
    ) {
        return "Failed to generate lineup: AI authentication error.";
    }

    if (msg.includes("400") || msg.toLowerCase().includes("invalid")) {
        return "Failed to generate lineup: Invalid request data.";
    }

    return "Failed to generate lineup. Please try again.";
}
