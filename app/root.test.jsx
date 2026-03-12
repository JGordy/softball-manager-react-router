import { getThemePreference } from "./root";

describe("Root Theme Logic", () => {
    it("returns dark when themePreference is 'dark'", () => {
        expect(getThemePreference({ themePreference: "dark" })).toBe("dark");
    });

    it("returns light when themePreference is 'light'", () => {
        expect(getThemePreference({ themePreference: "light" })).toBe("light");
    });

    it("returns auto when themePreference is 'auto'", () => {
        expect(getThemePreference({ themePreference: "auto" })).toBe("auto");
    });

    it("returns auto when themePreference is missing", () => {
        expect(getThemePreference({})).toBe("auto");
        expect(getThemePreference(null)).toBe("auto");
    });

    it("returns auto when themePreference is invalid", () => {
        expect(getThemePreference({ themePreference: "invalid" })).toBe("auto");
    });
});
