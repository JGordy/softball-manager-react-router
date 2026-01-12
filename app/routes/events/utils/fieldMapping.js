const ORIGIN_X = 50;
const ORIGIN_Y = 78; // Visual home plate location

const FOUL_ANGLE_THRESHOLD = 44.5;
const CATCHER_DISTANCE_THRESHOLD = 8;
const PITCHER_DISTANCE_THRESHOLD = 25;
const UP_THE_MIDDLE_DISTANCE_THRESHOLD = 35;

const DEPTH_THRESHOLD = {
    INFIELD: 38,
    SHALLOW: 45,
    STANDARD: 55,
};

const ANGLE_THRESHOLD = {
    LINE: 36,
    FIELD: 22,
    GAP: 7,
};

/**
 * Translates x, y percentage coordinates into descriptive field locations.
 * Home plate is assumed to be at x=50, y=78.
 *
 * @param {number} x - The x coordinate (0-100)
 * @param {number} y - The y coordinate (0-100)
 * @returns {string} - Descriptive location (e.g., "deep left-center gap")
 */
export function getFieldZone(x, y) {
    if (x === null || y === null) return "";

    const dx = x - ORIGIN_X;
    const dy = ORIGIN_Y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const horizontalAngle = Math.atan2(dx, Math.max(0.1, dy)) * (180 / Math.PI);

    if (dy < -1 || Math.abs(horizontalAngle) > FOUL_ANGLE_THRESHOLD)
        return "foul ball";

    if (distance < CATCHER_DISTANCE_THRESHOLD) return "in front of the catcher";

    let depth = "";
    if (distance < DEPTH_THRESHOLD.INFIELD) {
        depth = "infield";
    } else if (distance < DEPTH_THRESHOLD.SHALLOW) {
        depth = "shallow";
    } else if (distance < DEPTH_THRESHOLD.STANDARD) {
        depth = "standard";
    } else {
        depth = "deep";
    }

    let direction = "";
    const absAngle = Math.abs(horizontalAngle);

    if (absAngle > ANGLE_THRESHOLD.LINE)
        direction =
            horizontalAngle < 0 ? "left field line" : "right field line";
    else if (absAngle > ANGLE_THRESHOLD.FIELD)
        direction = horizontalAngle < 0 ? "left field" : "right field";
    else if (absAngle > ANGLE_THRESHOLD.GAP)
        direction =
            horizontalAngle < 0 ? "left-center gap" : "right-center gap";
    else direction = "center field";

    if (depth === "infield") {
        if (absAngle < 8 && distance < PITCHER_DISTANCE_THRESHOLD)
            return "back to the pitcher";
        if (absAngle < 8 && distance < UP_THE_MIDDLE_DISTANCE_THRESHOLD)
            return "up the middle";
        if (absAngle > 35)
            return horizontalAngle < 0
                ? "down the third base line"
                : "down the first base line";
        if (absAngle > 25)
            return horizontalAngle < 0 ? "to third base" : "to first base";
        return horizontalAngle < 0 ? "to shortstop" : "to second base";
    }

    // Combine for outfield hits
    const depthStr = depth === "standard" ? "" : `${depth} `;
    return `${depthStr}${direction}`.trim();
}
