import { getFieldZone } from "../fieldMapping";

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
    });
});
