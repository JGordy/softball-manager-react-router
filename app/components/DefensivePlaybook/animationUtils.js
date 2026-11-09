/**
 * @file animationUtils.js
 * Physics and spline animation helpers for smooth softball trajectory,
 * elevation curves, fielder timing windows, and SVG path generation.
 */

/**
 * Calculates a quadratic Bezier control point for a ball trajectory segment.
 * Throws and fly balls have realistic aerodynamic arcs in vertical perspective (-Y is UP),
 * while grounders stay true along the dirt.
 *
 * @param {{pos: {x: number, y: number}}} p1
 * @param {{pos: {x: number, y: number}}} p2
 * @param {boolean} [isGrounder=false]
 * @param {boolean} [isFlyBall=false]
 * @returns {{x: number, y: number}}
 */
export function getSegmentControlPoint(
    p1,
    p2,
    isGrounder = false,
    isFlyBall = false,
) {
    const x1 = p1.pos.x;
    const y1 = p1.pos.y;
    const x2 = p2.pos.x;
    const y2 = p2.pos.y;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1 || isGrounder) {
        return { x: mx, y: my };
    }

    // Aerodynamic arc height in screen Y coordinates (-Y is UP into the air)
    // Throws: crisp, realistic line-drive arc (~0.075 * dist, clamped between 1.2 and 3.0)
    // Fly balls: higher lofted arc (~0.10 * dist, clamped between 2.0 and 4.5)
    const elevFactor = isFlyBall ? 0.1 : 0.075;
    const maxElev = isFlyBall
        ? Math.min(4.5, Math.max(2.0, dist * elevFactor))
        : Math.min(3.0, Math.max(1.2, dist * elevFactor));

    // For a quadratic Bezier curve, the curve midpoint reaches my - maxElev
    // when cp.y = my - 2 * maxElev.
    return {
        x: Number(mx.toFixed(2)),
        y: Number((my - 2 * maxElev).toFixed(2)),
    };
}

/**
 * Normalizes timeline waypoints to filter out artificial mid-flight/in-air points
 * so that throws and hits have a single continuous, natural flight arc without
 * artificial intermediate dips or double-bounces.
 *
 * @param {Array<{step: number, pos: {x: number, y: number}, label?: string}>} timeline
 * @returns {Array<{step: number, pos: {x: number, y: number}, label?: string}>}
 */
export function sanitizeBallTimeline(timeline) {
    if (!timeline || timeline.length <= 2) return timeline || [];
    return timeline.filter((pt, idx) => {
        if (idx === 0 || idx === timeline.length - 1) return true;
        // Filter out artificial mid-flight waypoints
        if (
            /flight|in air|mid-flight|throw to 3b|throw home/i.test(
                pt.label || "",
            )
        ) {
            return false;
        }
        return true;
    });
}

/**
 * Calculates smooth continuous ball position along the timeline along
 * quadratic Bezier arcs for realistic flight without bouncing or looping.
 *
 * @param {Array<{step: number, pos: {x: number, y: number}, label: string}>} timeline
 * @param {number} currentStep - Progress from 0.0 to 1.0
 * @param {string} [playSubCategory=""] - Subcategory of play (e.g. "Infield Grounder")
 * @returns {{pos: {x: number, y: number}, groundPos: {x: number, y: number}, elevation: number, currentKeyframe: object|null}}
 */
export function getSmoothBallState(
    timeline,
    currentStep,
    playSubCategory = "",
) {
    const cleanTimeline = sanitizeBallTimeline(timeline);
    if (!cleanTimeline || cleanTimeline.length === 0) {
        return {
            pos: { x: 50, y: 78 },
            groundPos: { x: 50, y: 78 },
            elevation: 0,
            currentKeyframe: null,
        };
    }
    if (cleanTimeline.length === 1) {
        return {
            pos: cleanTimeline[0].pos,
            groundPos: cleanTimeline[0].pos,
            elevation: 0,
            currentKeyframe: cleanTimeline[0],
        };
    }

    const tClamped = Math.min(1, Math.max(0, currentStep));
    const n = cleanTimeline.length;

    // Find active segment
    let segIdx = 0;
    for (let i = 0; i < n - 1; i++) {
        if (
            tClamped >= cleanTimeline[i].step &&
            tClamped <= cleanTimeline[i + 1].step
        ) {
            segIdx = i;
            break;
        }
    }
    if (tClamped > cleanTimeline[n - 1].step) {
        segIdx = n - 2;
    }

    const p1 = cleanTimeline[segIdx];
    const p2 = cleanTimeline[segIdx + 1];

    const span = p2.step - p1.step;
    const rawTau = span > 0 ? (tClamped - p1.step) / span : 0;
    const tau = Math.min(1, Math.max(0, rawTau));

    const isGrounder =
        segIdx === 0 &&
        (playSubCategory.includes("Grounder") ||
            playSubCategory.includes("Double Play"));

    const isFlyBall =
        segIdx === 0 &&
        (playSubCategory.includes("Fly Ball") ||
            playSubCategory.includes("Extra Bases"));

    const cp = getSegmentControlPoint(p1, p2, isGrounder, isFlyBall);

    // Ground position (direct line of throw on turf)
    const groundPos = {
        x: (1 - tau) * p1.pos.x + tau * p2.pos.x,
        y: (1 - tau) * p1.pos.y + tau * p2.pos.y,
    };

    // Quadratic Bezier interpolation along the arc (the ball's true flight path)
    const oneMinusT = 1 - tau;
    const pos = {
        x:
            oneMinusT * oneMinusT * p1.pos.x +
            2 * oneMinusT * tau * cp.x +
            tau * tau * p2.pos.x,
        y:
            oneMinusT * oneMinusT * p1.pos.y +
            2 * oneMinusT * tau * cp.y +
            tau * tau * p2.pos.y,
    };

    // Elevation is vertical distance above ground in screen coordinates
    const elevation = Math.max(0, groundPos.y - pos.y);
    const currentKeyframe = rawTau > 0.5 ? p2 : p1;

    return {
        pos,
        groundPos,
        elevation,
        currentKeyframe,
    };
}

/**
 * Generates smooth SVG path string through all ball timeline waypoints using
 * quadratic Bezier arcs for throws and hits.
 *
 * @param {Array<{step: number, pos: {x: number, y: number}}>} timeline
 * @param {string} [playSubCategory=""]
 * @returns {string} SVG Path d string
 */
export function generateSmoothTrajectoryPath(timeline, playSubCategory = "") {
    const cleanTimeline = sanitizeBallTimeline(timeline);
    if (!cleanTimeline || cleanTimeline.length < 2) return "";
    let path = `M ${cleanTimeline[0].pos.x} ${cleanTimeline[0].pos.y}`;
    for (let i = 0; i < cleanTimeline.length - 1; i++) {
        const p1 = cleanTimeline[i];
        const p2 = cleanTimeline[i + 1];
        const isGrounder =
            i === 0 &&
            (playSubCategory.includes("Grounder") ||
                playSubCategory.includes("Double Play"));
        const isFlyBall =
            i === 0 &&
            (playSubCategory.includes("Fly Ball") ||
                playSubCategory.includes("Extra Bases"));
        const cp = getSegmentControlPoint(p1, p2, isGrounder, isFlyBall);
        path += ` Q ${cp.x} ${cp.y} ${p2.pos.x} ${p2.pos.y}`;
    }
    return path;
}

/**
 * Generates separate smooth SVG paths for the batted ball (hit) and subsequent throws.
 * The hit is the initial flight from home plate to the fielding location.
 * Subsequent segments represent defensive throws (e.g. to cutoff or bag).
 *
 * @param {Array<{step: number, pos: {x: number, y: number}}>} timeline
 * @param {string} [playSubCategory=""]
 * @returns {{hitPath: string, throwPath: string}}
 */
export function generateTrajectorySegments(timeline, playSubCategory = "") {
    const cleanTimeline = sanitizeBallTimeline(timeline);
    if (!cleanTimeline || cleanTimeline.length < 2) {
        return { hitPath: "", throwPath: "" };
    }

    const isGrounder =
        playSubCategory.includes("Grounder") ||
        playSubCategory.includes("Double Play");
    const isFlyBall =
        playSubCategory.includes("Fly Ball") ||
        playSubCategory.includes("Extra Bases");

    // 1. Hit path: from home contact (cleanTimeline[0]) to fielded point (cleanTimeline[1])
    const p0 = cleanTimeline[0];
    const p1 = cleanTimeline[1];
    const cpHit = getSegmentControlPoint(p0, p1, isGrounder, isFlyBall);
    const hitPath = `M ${p0.pos.x} ${p0.pos.y} Q ${cpHit.x} ${cpHit.y} ${p1.pos.x} ${p1.pos.y}`;

    // 2. Throw path: from fielded point through cutoff/target bases
    let throwPath = "";
    if (cleanTimeline.length > 2) {
        throwPath = `M ${cleanTimeline[1].pos.x} ${cleanTimeline[1].pos.y}`;
        for (let i = 1; i < cleanTimeline.length - 1; i++) {
            const pa = cleanTimeline[i];
            const pb = cleanTimeline[i + 1];
            const cpThrow = getSegmentControlPoint(pa, pb, false, false);
            throwPath += ` Q ${cpThrow.x} ${cpThrow.y} ${pb.pos.x} ${pb.pos.y}`;
        }
    }

    return { hitPath, throwPath };
}

/**
 * Realistic situational timing windows per fielder priority.
 * Fielder movement is staggered based on situational duties.
 *
 * @param {string} priority - "primary" | "cutoff" | "coverage" | "backup"
 * @returns {{start: number, end: number}}
 */
function getFielderTiming(priority) {
    switch (priority) {
        case "primary":
            return { start: 0.0, end: 0.42 }; // Reacts immediately to field the ball
        case "cutoff":
            return { start: 0.05, end: 0.6 }; // Sprints to cutoff position
        case "coverage":
            return { start: 0.08, end: 0.72 }; // Runs to cover base
        case "backup":
        default:
            return { start: 0.15, end: 0.88 }; // Takes backup angle behind throw
    }
}

/**
 * Calculates smooth interpolated position for a fielder with priority-based easing.
 *
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} target
 * @param {number} progress - Overall timeline progress (0.0 to 1.0)
 * @param {string} priority - Fielder priority
 * @returns {{x: number, y: number}}
 */
export function getFielderInterpolatedPos(start, target, progress, priority) {
    if (!start || !target) return { x: 50, y: 50 };

    const { start: tStart, end: tEnd } = getFielderTiming(priority);

    if (progress <= tStart) {
        return { ...start };
    }
    if (progress >= tEnd) {
        return { ...target };
    }

    // Normalized progress in active running window
    const localT = (progress - tStart) / (tEnd - tStart);

    // Smooth cubic ease-in-out for realistic acceleration & deceleration
    const ease =
        localT < 0.5
            ? 4 * localT * localT * localT
            : 1 - Math.pow(-2 * localT + 2, 3) / 2;

    return {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
    };
}
