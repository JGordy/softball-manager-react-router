import {
    ORIGIN_X,
    ORIGIN_Y,
    FOUL_ANGLE_THRESHOLD,
    CATCHER_DISTANCE_THRESHOLD,
    PITCHER_DISTANCE_THRESHOLD,
    MAX_DISTANCE_THRESHOLD,
    DEPTH_THRESHOLD,
    ANGLE_THRESHOLD,
    EXTENDED_DISTANCE_THRESHOLD,
} from "../constants/fieldMapping";

/**
 * Translates x, y percentage coordinates into descriptive field locations.
 * Home plate is assumed to be at x=50, y=78.
 *
 * @param {number} x - The x coordinate (0-100)
 * @param {number} y - The y coordinate (0-100)
 * @param {string} [actionType] - The type of play (e.g. "HR")
 * @returns {string} - Descriptive location (e.g., "deep left-center gap")
 */
export function getFieldZone(x, y, actionType) {
    if (x === null || y === null) return "";

    const dx = x - ORIGIN_X;
    const dy = ORIGIN_Y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const horizontalAngle = Math.atan2(dx, Math.max(0.1, dy)) * (180 / Math.PI);

    if (dy < -1 || Math.abs(horizontalAngle) > FOUL_ANGLE_THRESHOLD)
        return "foul ball";

    if (distance < CATCHER_DISTANCE_THRESHOLD) return "in front of the catcher";

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

    if (actionType === "HR" && distance > MAX_DISTANCE_THRESHOLD) {
        return `home run to ${direction}`;
    }

    if (distance < DEPTH_THRESHOLD.INFIELD) {
        if (absAngle < 8) {
            if (distance < PITCHER_DISTANCE_THRESHOLD)
                return "back to the pitcher";
            return "up the middle";
        }

        if (absAngle > 35)
            return horizontalAngle < 0
                ? "down the third base line"
                : "down the first base line";
        if (absAngle > 25)
            return horizontalAngle < 0 ? "to third base" : "to first base";
        return horizontalAngle < 0 ? "to shortstop" : "to second base";
    }

    let depth = "";
    if (distance < DEPTH_THRESHOLD.SHALLOW) {
        depth = "shallow";
    } else if (distance < DEPTH_THRESHOLD.STANDARD) {
        depth = "standard";
    } else {
        depth = "deep";
    }

    // Combine for outfield hits
    const depthStr = depth === "standard" ? "" : `${depth} `;
    const baseDescription = `${depthStr}${direction}`.trim();

    if (actionType === "HR") {
        return `inside the park home run to ${baseDescription}`;
    }

    return baseDescription;
}

/**
 * Clamps coordinates based on the play type (e.g. enforcing HR floors and outfield fences).
 *
 * @param {number} x - Raw x coordinate (0-100)
 * @param {number} y - Raw y coordinate (0-100)
 * @param {string} actionType - The type of play (e.g. "HR", "1B")
 * @returns {{x: number, y: number}} - The clamped coordinates
 */
export function getClampedCoordinates(x, y, actionType) {
    const dx = x - ORIGIN_X;
    const dy = ORIGIN_Y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxDist =
        actionType === "HR"
            ? EXTENDED_DISTANCE_THRESHOLD
            : MAX_DISTANCE_THRESHOLD;

    const minDist = actionType === "HR" ? 50 : 0;

    let finalX = x;
    let finalY = y;

    if (dist > maxDist) {
        const ratio = maxDist / dist;
        finalX = ORIGIN_X + dx * ratio;
        finalY = ORIGIN_Y - dy * ratio;
    } else if (dist < minDist) {
        if (dist < 0.1) {
            // Absolute center/origin handling
            finalX = ORIGIN_X;
            finalY = ORIGIN_Y - minDist;
        } else {
            const ratio = minDist / dist;
            finalX = ORIGIN_X + dx * ratio;
            finalY = ORIGIN_Y - dy * ratio;
        }
    }

    return { x: finalX, y: finalY };
}
