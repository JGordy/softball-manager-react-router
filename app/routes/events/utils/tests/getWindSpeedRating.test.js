import getWindSpeedRating from "../getWindSpeedRating";

describe("getWindSpeedRating utility", () => {
    it('should return "Calm" for wind speed < 1 mph', () => {
        expect(getWindSpeedRating(0)).toEqual({
            label: "Calm",
            color: "blue.7",
        });
        expect(getWindSpeedRating(0.4)).toEqual({
            label: "Calm",
            color: "blue.7",
        });
    });

    it('should return "Light Air" for wind speed 1-3 mph', () => {
        expect(getWindSpeedRating(1)).toEqual({
            label: "Light Air",
            color: "blue.5",
        });
        expect(getWindSpeedRating(3)).toEqual({
            label: "Light Air",
            color: "blue.5",
        });
    });

    it('should return "Light Breeze" for wind speed 4-7 mph', () => {
        expect(getWindSpeedRating(4)).toEqual({
            label: "Light Breeze",
            color: "blue.2",
        });
        expect(getWindSpeedRating(7)).toEqual({
            label: "Light Breeze",
            color: "blue.2",
        });
    });

    it('should return "Gentle Breeze" for wind speed 8-12 mph', () => {
        expect(getWindSpeedRating(8)).toEqual({
            label: "Gentle Breeze",
            color: "green",
        });
        expect(getWindSpeedRating(12)).toEqual({
            label: "Gentle Breeze",
            color: "green",
        });
    });

    it('should return "Moderate Breeze" for wind speed 13-18 mph', () => {
        expect(getWindSpeedRating(13)).toEqual({
            label: "Moderate Breeze",
            color: "green.3",
        });
        expect(getWindSpeedRating(18)).toEqual({
            label: "Moderate Breeze",
            color: "green.3",
        });
    });

    it('should return "Fresh Breeze" for wind speed 19-24 mph', () => {
        expect(getWindSpeedRating(19)).toEqual({
            label: "Fresh Breeze",
            color: "yellow",
        });
        expect(getWindSpeedRating(24)).toEqual({
            label: "Fresh Breeze",
            color: "yellow",
        });
    });

    it('should return "Strong Breeze" for wind speed 25-31 mph', () => {
        expect(getWindSpeedRating(25)).toEqual({
            label: "Strong Breeze",
            color: "orange.5",
        });
        expect(getWindSpeedRating(31)).toEqual({
            label: "Strong Breeze",
            color: "orange.5",
        });
    });

    it('should return "Near Gale" for wind speed 32-38 mph', () => {
        expect(getWindSpeedRating(32)).toEqual({
            label: "Near Gale",
            color: "orange",
        });
        expect(getWindSpeedRating(38)).toEqual({
            label: "Near Gale",
            color: "orange",
        });
    });

    it('should return "Gale" for wind speed 39-46 mph', () => {
        expect(getWindSpeedRating(39)).toEqual({
            label: "Gale",
            color: "red.2",
        });
        expect(getWindSpeedRating(46)).toEqual({
            label: "Gale",
            color: "red.2",
        });
    });

    it('should return "Strong Gale" for wind speed 47-54 mph', () => {
        expect(getWindSpeedRating(47)).toEqual({
            label: "Strong Gale",
            color: "red.5",
        });
        expect(getWindSpeedRating(54)).toEqual({
            label: "Strong Gale",
            color: "red.5",
        });
    });

    it('should return "Storm" for wind speed 55-63 mph', () => {
        expect(getWindSpeedRating(55)).toEqual({
            label: "Storm",
            color: "red.9",
        });
        expect(getWindSpeedRating(63)).toEqual({
            label: "Storm",
            color: "red.9",
        });
    });

    it('should return "Hurricane Force" for wind speed >= 64 mph', () => {
        expect(getWindSpeedRating(64)).toEqual({
            label: "Hurricane Force",
            color: "purple",
        });
        expect(getWindSpeedRating(100)).toEqual({
            label: "Hurricane Force",
            color: "purple",
        });
        expect(getWindSpeedRating(150)).toEqual({
            label: "Hurricane Force",
            color: "purple",
        });
    });

    it("should round decimal wind speeds", () => {
        expect(getWindSpeedRating(0.4).label).toBe("Calm"); // Rounds to 0
        expect(getWindSpeedRating(0.5).label).toBe("Light Air"); // Rounds to 1
        expect(getWindSpeedRating(3.4).label).toBe("Light Air"); // Rounds to 3
        expect(getWindSpeedRating(3.5).label).toBe("Light Breeze"); // Rounds to 4
    });
});
