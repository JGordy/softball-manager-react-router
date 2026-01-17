/**
 * Determines the field zone based on X coordinate (0-100 percentage)
 * @param {number} x - Horizontal percentage (0 = Left Foul Line, 100 = Right Foul Line roughly)
 * @returns {string} - "Left Field", "Center Field", or "Right Field"
 */
export const getZoneFromCoordinates = (x) => {
    // Simple logic based on percentage splits
    if (x < 33.3) return "Left Field";
    if (x > 66.6) return "Right Field";
    return "Center Field";
};
