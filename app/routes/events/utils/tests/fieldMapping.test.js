import { getFieldZone, getClampedCoordinates } from "../fieldMapping";

describe("getFieldZone", () => {
    it("should identify catcher location correctly", () => {
        expect(getFieldZone(50, 78)).toBe("in front of the catcher");
    });

    it("should identify pitcher location correctly", () => {
        expect(getFieldZone(50, 60)).toBe("back to the pitcher");
    });

    it("should return 'foul ball' for coordinates outside fair territory", () => {
        expect(getFieldZone(20, 78)).toBe("foul ball");
    });

    it("should identify zones even if coordinate is past the fence (UI handles clamping)", () => {
        // x=50, y=5 => dx=0, dy=73 => distance=73
        expect(getFieldZone(50, 5)).toBe("deep center field");
    });

    it("should identify hit down the first base line", () => {
        expect(getFieldZone(65, 61)).toBe("down the first base line");
    });

    it("should identify hit to first base", () => {
        expect(getFieldZone(60, 60)).toBe("to first base");
    });

    it("should identify hit to second base", () => {
        expect(getFieldZone(55, 60)).toBe("to second base");
    });

    it("should identify hit to shortstop", () => {
        expect(getFieldZone(45, 60)).toBe("to shortstop");
    });

    it("should identify hit to third base", () => {
        expect(getFieldZone(40, 60)).toBe("to third base");
    });

    it("should identify hit down the third base line", () => {
        expect(getFieldZone(35, 61)).toBe("down the third base line");
    });

    it("should identify shallow left field", () => {
        expect(getFieldZone(34, 40)).toBe("shallow left field");
    });

    it("should identify shallow center field", () => {
        expect(getFieldZone(50, 35)).toBe("shallow center field");
    });

    it("should identify deep center field", () => {
        expect(getFieldZone(50, 10)).toBe("deep center field");
    });

    it("should identify deep left field", () => {
        expect(getFieldZone(20, 20)).toBe("deep left field");
    });

    it("should identify standard left field (no prefix)", () => {
        expect(getFieldZone(30, 30)).toBe("left field");
    });

    it("should identify standard center field (no prefix)", () => {
        expect(getFieldZone(50, 25)).toBe("center field");
    });

    it("should identify standard right field (no prefix)", () => {
        expect(getFieldZone(70, 30)).toBe("right field");
    });

    it("should identify 'up the middle' hits", () => {
        // x=50, y=45 => dx=0, dy=33 => distance=33, angle=0
        // distance 33 is between 25 (pitcher) and 35 (up the middle threshold)
        expect(getFieldZone(50, 45)).toBe("up the middle");
    });

    it("should identify hits to the left-center gap", () => {
        // Angle between 7 and 22 degrees
        // dx=-12, dy=48 -> dist=49.5 (standard), angle=-14 (gap)
        expect(getFieldZone(38, 30)).toBe("left-center gap");
    });

    it("should identify hits to the right-center gap", () => {
        // dx=12, dy=48 -> dist=49.5 (standard), angle=14 (gap)
        expect(getFieldZone(62, 30)).toBe("right-center gap");
    });

    it("should identify shallow right field", () => {
        // dx=20, dy=33 -> dist=38.6 (shallow), angle=31 (field)
        expect(getFieldZone(70, 45)).toBe("shallow right field");
    });

    it("should identify deep right field", () => {
        // distance > 55
        expect(getFieldZone(85, 20)).toBe("deep right field");
    });

    it("should handle null coordinates gracefully", () => {
        expect(getFieldZone(null, null)).toBe("");
        expect(getFieldZone(50, null)).toBe("");
        expect(getFieldZone(null, 78)).toBe("");
    });

    describe("Home Runs", () => {
        it("should identify over-the-fence home run to center field", () => {
            // distance > 68 (MAX_DISTANCE_THRESHOLD)
            expect(getFieldZone(50, 5, "HR")).toBe("home run to center field");
        });

        it("should identify over-the-fence home run to left field", () => {
            // x=10, y=10 => distance=78.9 (>68)
            // angle ≈ -30deg (left field)
            expect(getFieldZone(10, 10, "HR")).toBe("home run to left field");
        });

        it("should identify inside-the-park home run to center field (standard depth)", () => {
            // distance = 50 (MIN_HR_DISTANCE_THRESHOLD)
            expect(getFieldZone(50, 28, "HR")).toBe(
                "inside the park home run to center field",
            );
        });

        it("should identify inside-the-park home run to deep center field", () => {
            // distance = 63 (Deep depth range)
            expect(getFieldZone(50, 15, "HR")).toBe(
                "inside the park home run to deep center field",
            );
        });

        it("should still identify foul balls when HR action is selected", () => {
            expect(getFieldZone(20, 78, "HR")).toBe("foul ball");
        });
    });
});

describe("getClampedCoordinates", () => {
    it("should clamp a deep hit to the fence for singles", () => {
        // x=50, y=5 => dist=73 (>68)
        const result = getClampedCoordinates(50, 5, "1B");
        expect(result.y).toBeCloseTo(10, 0); // 78 - 68 = 10
    });

    it("should allow a deep hit beyond the fence for home runs", () => {
        // x=50, y=5 => dist=73 (below 80)
        const result = getClampedCoordinates(50, 5, "HR");
        expect(result.y).toBe(5);
    });

    it("should snap a shallow hit to the standard outfield floor for home runs", () => {
        // Click at pitcher location: x=50, y=62 (dist=16)
        const result = getClampedCoordinates(50, 62, "HR");
        // Should snap to MIN_HR_DISTANCE_THRESHOLD (50)
        expect(result.y).toBeCloseTo(28, 0);
    });

    it("should snap an origin click to the outfield floor for home runs", () => {
        // Click exactly at home plate
        const result = getClampedCoordinates(50, 78, "HR");
        expect(result.y).toBeCloseTo(28, 0);
    });

    it("should not clamp a normal infield hit for singles", () => {
        const result = getClampedCoordinates(50, 62, "1B");
        expect(result.x).toBe(50);
        expect(result.y).toBe(62);
    });

    it("should clamp a deep hit to standard outfield for pop outs", () => {
        // x=50, y=10 => dist=68 (Exactly at fence)
        // Pop Out max is DEPTH_THRESHOLD.STANDARD (55).
        const result = getClampedCoordinates(50, 10, "Pop Out");
        expect(result.y).toBeCloseTo(23, 0); // 78 - 55 = 23
    });

    it("should snap an infield hit to shallow outfield for fly outs", () => {
        // x=50, y=60 => dist=18 (Pitcher area)
        // Fly Out min is DEPTH_THRESHOLD.INFIELD (38).
        const result = getClampedCoordinates(50, 60, "Fly Out");
        expect(result.y).toBeCloseTo(39.9, 1); // 78 - 38.1 = 39.9
    });
});
