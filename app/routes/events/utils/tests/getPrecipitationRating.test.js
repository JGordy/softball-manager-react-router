import getPrecipitationChanceRating from "../getPrecipitationRating";

describe("getPrecipitationChanceRating utility", () => {
    it('should return "None" with blue color for < 1% precipitation', () => {
        expect(getPrecipitationChanceRating(0)).toEqual({
            label: "None",
            color: "blue",
        });
        expect(getPrecipitationChanceRating(0.005)).toEqual({
            label: "None",
            color: "blue",
        });
        expect(getPrecipitationChanceRating(0.009)).toEqual({
            label: "None",
            color: "blue",
        });
    });

    it('should return "Light" with green color for 1-19% precipitation', () => {
        expect(getPrecipitationChanceRating(0.01)).toEqual({
            label: "Light",
            color: "green",
        });
        expect(getPrecipitationChanceRating(0.1)).toEqual({
            label: "Light",
            color: "green",
        });
        expect(getPrecipitationChanceRating(0.19)).toEqual({
            label: "Light",
            color: "green",
        });
    });

    it('should return "Moderate" with yellow color for 20-49% precipitation', () => {
        expect(getPrecipitationChanceRating(0.2)).toEqual({
            label: "Moderate",
            color: "yellow",
        });
        expect(getPrecipitationChanceRating(0.35)).toEqual({
            label: "Moderate",
            color: "yellow",
        });
        expect(getPrecipitationChanceRating(0.49)).toEqual({
            label: "Moderate",
            color: "yellow",
        });
    });

    it('should return "High" with orange color for 50-79% precipitation', () => {
        expect(getPrecipitationChanceRating(0.5)).toEqual({
            label: "High",
            color: "orange",
        });
        expect(getPrecipitationChanceRating(0.65)).toEqual({
            label: "High",
            color: "orange",
        });
        expect(getPrecipitationChanceRating(0.79)).toEqual({
            label: "High",
            color: "orange",
        });
    });

    it('should return "Very High" with red color for >= 80% precipitation', () => {
        expect(getPrecipitationChanceRating(0.8)).toEqual({
            label: "Very High",
            color: "red",
        });
        expect(getPrecipitationChanceRating(0.9)).toEqual({
            label: "Very High",
            color: "red",
        });
        expect(getPrecipitationChanceRating(1.0)).toEqual({
            label: "Very High",
            color: "red",
        });
    });

    it("should handle boundary values correctly", () => {
        // At exactly 1% (0.01), should be Light not None
        expect(getPrecipitationChanceRating(0.01).label).toBe("Light");

        // At exactly 20% (0.20), should be Moderate not Light
        expect(getPrecipitationChanceRating(0.2).label).toBe("Moderate");

        // At exactly 50% (0.50), should be High not Moderate
        expect(getPrecipitationChanceRating(0.5).label).toBe("High");

        // At exactly 80% (0.80), should be Very High not High
        expect(getPrecipitationChanceRating(0.8).label).toBe("Very High");
    });
});
