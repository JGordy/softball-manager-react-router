/**
 * Formats an E.164 phone number for display.
 * @param {string} phone - The phone number to format.
 * @returns {string} - The formatted phone number.
 */
export function formatPhoneNumber(phone) {
    if (!phone) return "";

    // Remove any non-digits
    const cleaned = phone.replace(/\D/g, "");

    // Check if it's a US number (starts with 1 and has 11 digits)
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
        const areaCode = cleaned.slice(1, 4);
        const prefix = cleaned.slice(4, 7);
        const line = cleaned.slice(7, 11);
        return `(${areaCode}) ${prefix}-${line}`;
    }

    // For international numbers or non-standard US numbers, return as is
    return phone;
}
