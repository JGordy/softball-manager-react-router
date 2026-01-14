import {
    ORIGIN_X,
    ORIGIN_Y,
    FOUL_ANGLE_THRESHOLD,
    CATCHER_DISTANCE_THRESHOLD,
    PITCHER_DISTANCE_THRESHOLD,
    MAX_DISTANCE_THRESHOLD,
    DEPTH_THRESHOLD,
    ANGLE_THRESHOLD,
} from "../../utils/fieldMapping";

/**
 * Helper to convert baseball coordinates (distance and angle from home plate)
 * into standard X, Y percentages for the SVG screen.
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    // We subtract 90 degrees because 0 degrees in baseball is "straight up",
    // but in math 0 degrees is "straight right".
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

/**
 * Generates the SVG "path" data for a zone wedge.
 * It draws an outer arc, then a line down, then an inner arc back, creating a solid shape.
 */
function describeRingSegment(x, y, minR, maxR, minA, maxA) {
    const startOuter = polarToCartesian(x, y, maxR, maxA);
    const endOuter = polarToCartesian(x, y, maxR, minA);

    const largeArcFlag = maxA - minA <= 180 ? "0" : "1";

    // If the zone starts at home plate (radius 0), we draw a simple wedge (triangle with an arc)
    if (minR <= 0) {
        return [
            "M",
            x,
            y,
            "L",
            startOuter.x,
            startOuter.y,
            "A",
            maxR,
            maxR,
            0,
            largeArcFlag,
            0,
            endOuter.x,
            endOuter.y,
            "Z",
        ].join(" ");
    }

    const startInner = polarToCartesian(x, y, minR, minA);
    const endInner = polarToCartesian(x, y, minR, maxA);

    // For outfield/infield zones, we draw a 'rainbow' shape (two arcs connected by lines)
    return [
        "M",
        startOuter.x,
        startOuter.y,
        "A",
        maxR,
        maxR,
        0,
        largeArcFlag,
        0,
        endOuter.x,
        endOuter.y,
        "L",
        startInner.x,
        startInner.y,
        "A",
        minR,
        minR,
        0,
        largeArcFlag,
        1,
        endInner.x,
        endInner.y,
        "Z",
    ].join(" ");
}

export default function FieldHighlight({ x, y }) {
    if (x === null || y === null) return null;

    // 1. Calculate how far and at what angle the ball was hit from Home Plate
    const dx = x - ORIGIN_X;
    const dy = ORIGIN_Y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dx, Math.max(0.1, dy)) * (180 / Math.PI);
    const absAngle = Math.abs(angle);

    // Foul ball and boundary check (don't show highlight if outside lines or past fence)
    if (
        dy < -1 ||
        absAngle > FOUL_ANGLE_THRESHOLD ||
        distance > MAX_DISTANCE_THRESHOLD
    )
        return null;

    let minR, maxR, minA, maxA;

    // 2. Determine the Depth Band (The "Rainbow" distance from home)
    if (distance < CATCHER_DISTANCE_THRESHOLD) {
        minR = 0;
        maxR = CATCHER_DISTANCE_THRESHOLD;
        minA = -FOUL_ANGLE_THRESHOLD;
        maxA = FOUL_ANGLE_THRESHOLD;
    } else if (distance < DEPTH_THRESHOLD.INFIELD) {
        minR = CATCHER_DISTANCE_THRESHOLD;
        maxR = DEPTH_THRESHOLD.INFIELD;

        // Infield zones (Pitcher, Up the middle, Base lines, etc.)
        if (absAngle < 8) {
            if (distance < PITCHER_DISTANCE_THRESHOLD) {
                maxR = PITCHER_DISTANCE_THRESHOLD;
            } else {
                minR = PITCHER_DISTANCE_THRESHOLD;
                maxR = DEPTH_THRESHOLD.INFIELD;
            }
            minA = -8;
            maxA = 8;
        } else if (absAngle > 35) {
            minA = angle < 0 ? -FOUL_ANGLE_THRESHOLD : 35;
            maxA = angle < 0 ? -35 : FOUL_ANGLE_THRESHOLD;
        } else if (absAngle > 25) {
            minA = angle < 0 ? -35 : 25;
            maxA = angle < 0 ? -25 : 35;
        } else {
            minA = angle < 0 ? -25 : 8;
            maxA = angle < 0 ? -8 : 25;
        }
    } else {
        // Outfield zones (Shallow, Standard, Deep)
        if (distance < DEPTH_THRESHOLD.SHALLOW) {
            minR = DEPTH_THRESHOLD.INFIELD;
            maxR = DEPTH_THRESHOLD.SHALLOW;
        } else if (distance < DEPTH_THRESHOLD.STANDARD) {
            minR = DEPTH_THRESHOLD.SHALLOW;
            maxR = DEPTH_THRESHOLD.STANDARD;
        } else {
            minR = DEPTH_THRESHOLD.STANDARD;
            maxR = MAX_DISTANCE_THRESHOLD;
        }

        // 3. Determine the Direction Band (Wedges for Left Field, Gaps, Center, etc.)
        if (absAngle > ANGLE_THRESHOLD.LINE) {
            minA = angle < 0 ? -FOUL_ANGLE_THRESHOLD : ANGLE_THRESHOLD.LINE;
            maxA = angle < 0 ? -ANGLE_THRESHOLD.LINE : FOUL_ANGLE_THRESHOLD;
        } else if (absAngle > ANGLE_THRESHOLD.FIELD) {
            minA = angle < 0 ? -ANGLE_THRESHOLD.LINE : ANGLE_THRESHOLD.FIELD;
            maxA = angle < 0 ? -ANGLE_THRESHOLD.FIELD : ANGLE_THRESHOLD.LINE;
        } else if (absAngle > ANGLE_THRESHOLD.GAP) {
            minA = angle < 0 ? -ANGLE_THRESHOLD.FIELD : ANGLE_THRESHOLD.GAP;
            maxA = angle < 0 ? -ANGLE_THRESHOLD.GAP : ANGLE_THRESHOLD.FIELD;
        } else {
            minA = -ANGLE_THRESHOLD.GAP;
            maxA = ANGLE_THRESHOLD.GAP;
        }
    }

    const path = describeRingSegment(
        ORIGIN_X,
        ORIGIN_Y,
        minR,
        maxR,
        minA,
        maxA,
    );

    return (
        <svg
            viewBox="0 0 100 100"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 4,
            }}
        >
            <path
                d={path}
                fill="rgba(255, 255, 255, 0.2)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ transition: "d 0.1s ease" }}
            />
            <path
                d={path}
                fill="none"
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ transition: "d 0.1s ease" }}
            />
        </svg>
    );
}
