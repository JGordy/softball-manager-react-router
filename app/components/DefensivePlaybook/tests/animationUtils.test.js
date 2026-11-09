import {
    getSegmentControlPoint,
    sanitizeBallTimeline,
    getSmoothBallState,
    generateSmoothTrajectoryPath,
    generateTrajectorySegments,
    getFielderInterpolatedPos,
} from "../animationUtils";

describe("Defensive Playbook animationUtils", () => {
    describe("getSegmentControlPoint", () => {
        const p1 = { pos: { x: 50, y: 78 } };
        const p2 = { pos: { x: 34, y: 56 } };

        it("returns direct midpoint for grounders", () => {
            const cp = getSegmentControlPoint(p1, p2, true, false);
            expect(cp.x).toBe(42);
            expect(cp.y).toBe(67);
        });

        it("returns direct midpoint when distance is less than 1", () => {
            const pClose = { pos: { x: 50.2, y: 78.2 } };
            const cp = getSegmentControlPoint(p1, pClose, false, false);
            expect(cp.x).toBeCloseTo(50.1, 1);
            expect(cp.y).toBeCloseTo(78.1, 1);
        });

        it("elevates the control point in -Y direction for throws", () => {
            const cp = getSegmentControlPoint(p1, p2, false, false);
            expect(cp.x).toBe(42);
            // Y is elevated upward (-Y is UP in screen coordinates)
            expect(cp.y).toBeLessThan(67);
        });

        it("applies higher elevation arc for fly balls compared to throws", () => {
            const throwCp = getSegmentControlPoint(p1, p2, false, false);
            const flyCp = getSegmentControlPoint(p1, p2, false, true);
            // Fly ball has lower Y (higher upward in the air)
            expect(flyCp.y).toBeLessThan(throwCp.y);
        });

        it("clamps max elevation within realistic slow-pitch bounds", () => {
            const pFar = { pos: { x: 90, y: 10 } };
            const throwCp = getSegmentControlPoint(p1, pFar, false, false);
            const my = (p1.pos.y + pFar.pos.y) / 2;
            // Throw elevation clamped to max 3.0 (so cp.y = my - 2 * 3.0 = my - 6.0)
            expect(throwCp.y).toBeCloseTo(my - 6.0, 1);
        });
    });

    describe("sanitizeBallTimeline", () => {
        it("returns empty or unchanged array for short timelines", () => {
            expect(sanitizeBallTimeline(null)).toEqual([]);
            expect(sanitizeBallTimeline([])).toEqual([]);
            const twoPoints = [
                { step: 0, pos: { x: 50, y: 78 } },
                { step: 1, pos: { x: 66, y: 56 } },
            ];
            expect(sanitizeBallTimeline(twoPoints)).toEqual(twoPoints);
        });

        it("filters out artificial mid-flight waypoints while preserving endpoints", () => {
            const timeline = [
                { step: 0, pos: { x: 50, y: 78 }, label: "Hit Contact" },
                { step: 0.25, pos: { x: 42, y: 67 }, label: "Ball in flight" },
                { step: 0.5, pos: { x: 34, y: 56 }, label: "Fielded by 3B" },
                { step: 0.75, pos: { x: 50, y: 56 }, label: "Throw in flight" },
                { step: 1, pos: { x: 66, y: 56 }, label: "Out at 1B" },
            ];

            const cleaned = sanitizeBallTimeline(timeline);
            expect(cleaned.length).toBe(3);
            expect(cleaned[0].label).toBe("Hit Contact");
            expect(cleaned[1].label).toBe("Fielded by 3B");
            expect(cleaned[2].label).toBe("Out at 1B");
        });
    });

    describe("getSmoothBallState", () => {
        const sampleTimeline = [
            { step: 0, pos: { x: 50, y: 78 }, label: "Hit Contact" },
            { step: 0.4, pos: { x: 34, y: 56 }, label: "Fielded" },
            { step: 1, pos: { x: 66, y: 56 }, label: "Play at 1B" },
        ];

        it("handles empty or null timelines gracefully", () => {
            const state = getSmoothBallState([], 0.5);
            expect(state.pos).toEqual({ x: 50, y: 78 });
            expect(state.elevation).toBe(0);
            expect(state.currentKeyframe).toBeNull();
        });

        it("handles single-point timelines", () => {
            const single = [{ step: 0, pos: { x: 40, y: 40 }, label: "Start" }];
            const state = getSmoothBallState(single, 0.5);
            expect(state.pos).toEqual({ x: 40, y: 40 });
            expect(state.currentKeyframe).toEqual(single[0]);
        });

        it("returns exact start position at progress 0", () => {
            const state = getSmoothBallState(
                sampleTimeline,
                0.0,
                "Infield Grounder",
            );
            expect(state.pos.x).toBeCloseTo(50, 1);
            expect(state.pos.y).toBeCloseTo(78, 1);
            expect(state.currentKeyframe.label).toBe("Hit Contact");
        });

        it("returns exact end position at progress 1", () => {
            const state = getSmoothBallState(
                sampleTimeline,
                1.0,
                "Infield Grounder",
            );
            expect(state.pos.x).toBeCloseTo(66, 1);
            expect(state.pos.y).toBeCloseTo(56, 1);
            expect(state.currentKeyframe.label).toBe("Play at 1B");
        });

        it("interpolates smooth positions and non-negative elevation", () => {
            const state = getSmoothBallState(
                sampleTimeline,
                0.7,
                "Infield Grounder",
            );
            expect(state.pos.x).toBeGreaterThan(34);
            expect(state.pos.x).toBeLessThan(66);
            expect(state.elevation).toBeGreaterThanOrEqual(0);
            expect(state.groundPos).toBeDefined();
        });
    });

    describe("generateSmoothTrajectoryPath", () => {
        it("returns empty string for insufficient points", () => {
            expect(generateSmoothTrajectoryPath([])).toBe("");
            expect(
                generateSmoothTrajectoryPath([
                    { step: 0, pos: { x: 0, y: 0 } },
                ]),
            ).toBe("");
        });

        it("generates valid SVG quadratic Bezier path", () => {
            const timeline = [
                { step: 0, pos: { x: 50, y: 78 } },
                { step: 0.5, pos: { x: 34, y: 56 } },
                { step: 1.0, pos: { x: 66, y: 56 } },
            ];

            const path = generateSmoothTrajectoryPath(
                timeline,
                "Fly Ball / Tag",
            );
            expect(path.startsWith("M 50 78")).toBe(true);
            expect(path).toContain("Q");
            expect(path).toContain("66 56");
        });
    });

    describe("generateTrajectorySegments", () => {
        it("returns empty strings for insufficient points", () => {
            expect(generateTrajectorySegments([])).toEqual({
                hitPath: "",
                throwPath: "",
            });
            expect(
                generateTrajectorySegments([{ step: 0, pos: { x: 0, y: 0 } }]),
            ).toEqual({
                hitPath: "",
                throwPath: "",
            });
        });

        it("generates hit path only when play has no subsequent throws", () => {
            const timeline = [
                { step: 0, pos: { x: 50, y: 78 } },
                { step: 1.0, pos: { x: 66, y: 56 } },
            ];

            const { hitPath, throwPath } = generateTrajectorySegments(
                timeline,
                "Infield Grounder",
            );
            expect(hitPath.startsWith("M 50 78")).toBe(true);
            expect(hitPath).toContain("66 56");
            expect(throwPath).toBe("");
        });

        it("generates distinct hit and throw paths for multi-segment plays", () => {
            const timeline = [
                { step: 0, pos: { x: 50, y: 78 }, label: "Hit Contact" },
                { step: 0.45, pos: { x: 42, y: 52 }, label: "Fielded by SS" },
                { step: 1.0, pos: { x: 66, y: 56 }, label: "Caught at 1B" },
            ];

            const { hitPath, throwPath } = generateTrajectorySegments(
                timeline,
                "Infield Grounder",
            );
            expect(hitPath.startsWith("M 50 78")).toBe(true);
            expect(hitPath).toContain("42 52");
            expect(throwPath.startsWith("M 42 52")).toBe(true);
            expect(throwPath).toContain("66 56");
        });
    });

    describe("getFielderInterpolatedPos", () => {
        const start = { x: 34, y: 56 };
        const target = { x: 30, y: 50 };

        it("returns default position when start or target is missing", () => {
            expect(
                getFielderInterpolatedPos(null, target, 0.5, "primary"),
            ).toEqual({
                x: 50,
                y: 50,
            });
            expect(
                getFielderInterpolatedPos(start, null, 0.5, "primary"),
            ).toEqual({
                x: 50,
                y: 50,
            });
        });

        it("returns start position before fielder reaction start time", () => {
            // Backup starts at 0.15
            const pos = getFielderInterpolatedPos(start, target, 0.1, "backup");
            expect(pos).toEqual(start);
        });

        it("returns target position after fielder reaches destination", () => {
            // Primary ends at 0.42
            const pos = getFielderInterpolatedPos(
                start,
                target,
                0.5,
                "primary",
            );
            expect(pos).toEqual(target);
        });

        it("interpolates smoothly between start and target during movement", () => {
            const pos = getFielderInterpolatedPos(
                start,
                target,
                0.2,
                "primary",
            );
            expect(pos.x).toBeLessThan(start.x);
            expect(pos.x).toBeGreaterThan(target.x);
            expect(pos.y).toBeLessThan(start.y);
            expect(pos.y).toBeGreaterThan(target.y);
        });

        it("staggers movement so primary fielders react sooner than backup fielders", () => {
            // At progress 0.1, primary fielder has already begun moving, backup has not
            const primaryPos = getFielderInterpolatedPos(
                start,
                target,
                0.1,
                "primary",
            );
            const backupPos = getFielderInterpolatedPos(
                start,
                target,
                0.1,
                "backup",
            );

            expect(primaryPos).not.toEqual(start);
            expect(backupPos).toEqual(start);
        });
    });
});
