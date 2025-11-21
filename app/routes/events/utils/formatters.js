/**
 * Converts a number to its ordinal form (1st, 2nd, 3rd, etc.)
 * @param {number} number - The number to convert
 * @returns {string} The ordinal string (e.g., "1st", "2nd", "3rd")
 */
export const getOrdinal = (number) => {
    const lastTwoDigits = number % 100;
    // Handle 11th, 12th, 13th as special cases
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return number + "th";
    }
    const lastDigit = number % 10;
    const suffixes = ["th", "st", "nd", "rd"];
    return number + (suffixes[lastDigit] || "th");
};
