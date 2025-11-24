import { adjustColorBasedOnDarkness } from "../adjustHexColor";

describe("adjustColorBasedOnDarkness", () => {
    it("should lighten a dark color", () => {
        const darkColor = "#000000"; // Black is dark
        const percent = 50;
        // 50% lighter than 0 is still 0 if we just multiply, but let's see the logic.
        // factor = 1 + 50/100 = 1.5. 0 * 1.5 = 0.
        // Wait, if it's 0, it stays 0.
        // Let's try a dark gray.
        const darkGray = "#333333"; // R=51, G=51, B=51
        // Factor 1.5 -> 76.5 -> 77 -> #4d4d4d
        const result = adjustColorBasedOnDarkness(darkGray, 50);
        expect(result).toBe("#4d4d4d");
    });

    it("should darken a light color", () => {
        const lightColor = "#ffffff"; // White is light
        const percent = 50;
        // Factor = 1 + (-50)/100 = 0.5
        // 255 * 0.5 = 127.5 -> 128 -> #808080
        const result = adjustColorBasedOnDarkness(lightColor, 50);
        expect(result).toBe("#808080");
    });

    it("should handle colors without hash", () => {
        const lightColor = "ffffff";
        const percent = 50;
        const result = adjustColorBasedOnDarkness(lightColor, 50);
        expect(result).toBe("#808080");
    });

    it("should clamp values to 0-255", () => {
        const color = "#ffffff";
        // Increase by 100% -> factor 2. 255*2 = 510 -> clamped to 255
        // But wait, white is light, so it will darken.
        // Let's use a dark color and lighten it a lot.
        const darkColor = "#101010";
        // Lighten by 10000%
        const result = adjustColorBasedOnDarkness(darkColor, 10000);
        expect(result).toBe("#ffffff");
    });
});
