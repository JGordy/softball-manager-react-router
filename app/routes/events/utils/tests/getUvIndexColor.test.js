import getUvIndexColor from "../getUvIndexColor";

describe("getUvIndexColor utility", () => {
    it('should return "lime" for UV index 0-2 (Low)', () => {
        expect(getUvIndexColor(0)).toBe("lime");
        expect(getUvIndexColor(1)).toBe("lime");
        expect(getUvIndexColor(2)).toBe("lime");
        expect(getUvIndexColor(2.4)).toBe("lime"); // Rounds to 2
    });

    it('should return "yellow" for UV index 3-5 (Moderate)', () => {
        expect(getUvIndexColor(2.5)).toBe("yellow"); // Rounds to 3
        expect(getUvIndexColor(3)).toBe("yellow");
        expect(getUvIndexColor(4)).toBe("yellow");
        expect(getUvIndexColor(5)).toBe("yellow");
    });

    it('should return "orange" for UV index 6-7 (High)', () => {
        expect(getUvIndexColor(6)).toBe("orange");
        expect(getUvIndexColor(7)).toBe("orange");
        expect(getUvIndexColor(7.4)).toBe("orange"); // Rounds to 7
    });

    it('should return "red" for UV index 8-10 (Very High)', () => {
        expect(getUvIndexColor(7.5)).toBe("red"); // Rounds to 8
        expect(getUvIndexColor(8)).toBe("red");
        expect(getUvIndexColor(9)).toBe("red");
        expect(getUvIndexColor(10)).toBe("red");
    });

    it('should return "purple" for UV index > 10 (Extreme)', () => {
        expect(getUvIndexColor(11)).toBe("purple");
        expect(getUvIndexColor(12)).toBe("purple");
        expect(getUvIndexColor(15)).toBe("purple");
    });

    it("should handle decimal values by rounding", () => {
        expect(getUvIndexColor(2.4)).toBe("lime"); // Rounds to 2
        expect(getUvIndexColor(2.5)).toBe("yellow"); // Rounds to 3
        expect(getUvIndexColor(5.4)).toBe("yellow"); // Rounds to 5
        expect(getUvIndexColor(5.5)).toBe("orange"); // Rounds to 6
    });

    it("should handle edge case of 0", () => {
        expect(getUvIndexColor(0)).toBe("lime");
    });
});
