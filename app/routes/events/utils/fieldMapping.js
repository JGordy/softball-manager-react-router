/**
 * Translates x, y percentage coordinates into descriptive field locations.
 * Home plate is assumed to be at x=50, y=100.
 *
 * @param {number} x - The x coordinate (0-100)
 * @param {number} y - The y coordinate (0-100)
 * @returns {string} - Descriptive location (e.g., "deep left-center gap")
 */
export function getFieldZone(x, y) {
    if (x === null || y === null) return "";

    // Home Plate is the bottom tip of the diamond, visually around y=78
    const originX = 50;
    const originY = 78;

    const dx = x - originX;
    const dy = originY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const horizontalAngle = Math.atan2(dx, Math.max(0.1, dy)) * (180 / Math.PI);

    if (dy < -1 || Math.abs(horizontalAngle) > 44.5) return "foul ball";

    if (distance < 8) return "in front of the catcher";

    let depth = "";
    if (distance < 38) {
        depth = "infield";
    } else if (distance < 45) {
        depth = "shallow";
    } else if (distance < 55) {
        depth = "standard";
    } else {
        depth = "deep";
    }

    let direction = "";
    const absAngle = Math.abs(horizontalAngle);

    if (absAngle > 36)
        direction =
            horizontalAngle < 0 ? "left field line" : "right field line";
    else if (absAngle > 22)
        direction = horizontalAngle < 0 ? "left field" : "right field";
    else if (absAngle > 7)
        direction =
            horizontalAngle < 0 ? "left-center gap" : "right-center gap";
    else direction = "center field";

    if (depth === "infield") {
        if (absAngle < 8 && distance < 25) return "back to the pitcher";
        if (absAngle < 8 && distance < 35) return "up the middle";
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
