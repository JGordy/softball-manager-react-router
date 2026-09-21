import {
    generateScoreboardSvg,
    getLogoDataUri,
    splitTeamName,
} from "../scoreboardSvg";

describe("scoreboardSvg utils", () => {
    describe("splitTeamName", () => {
        it("handles multi-word names by splitting last word into main", () => {
            expect(splitTeamName("Ormewood Park Sliders")).toEqual({
                prefix: "ORMEWOOD PARK",
                main: "SLIDERS",
            });
            expect(splitTeamName("Decatur Raiders")).toEqual({
                prefix: "DECATUR",
                main: "RAIDERS",
            });
        });

        it("handles single-word names", () => {
            expect(splitTeamName("Thunder")).toEqual({
                prefix: "",
                main: "THUNDER",
            });
        });

        it("handles empty or null names gracefully", () => {
            expect(splitTeamName("")).toEqual({ prefix: "", main: "TEAM" });
            expect(splitTeamName(null)).toEqual({ prefix: "", main: "TEAM" });
        });
    });

    it("returns a non-empty string or fallback for getLogoDataUri", () => {
        const uri = getLogoDataUri();
        expect(typeof uri).toBe("string");
    });

    it("generates an SVG with correct dimensions and theme colors", () => {
        const svg = generateScoreboardSvg({
            teamName: "Ormewood Park Sliders",
            opponentName: "Decatur Raiders",
            teamScore: 14,
            opponentScore: 8,
            isGameFinal: true,
        });

        expect(svg).toContain('width="1200"');
        expect(svg).toContain('height="630"');
        expect(svg).toContain("#111827"); // midnight navy
        expect(svg).toContain("#CCFF33"); // neon volt
        expect(svg).toContain("FINAL");
        expect(svg).toContain("ORMEWOOD PARK");
        expect(svg).toContain("SLIDERS");
        expect(svg).toContain("DECATUR");
        expect(svg).toContain("RAIDERS");
        expect(svg).toContain(">14<");
        expect(svg).toContain(">8<");
        expect(svg).toContain('font-size="110"'); // large score numbers
    });

    it("handles XML characters safely by escaping them", () => {
        const svg = generateScoreboardSvg({
            teamName: "AT&T <Team>",
            opponentName: 'The "Sluggers"',
            teamScore: 3,
            opponentScore: 2,
        });

        expect(svg).toContain("AT&amp;T");
        expect(svg).toContain("&lt;TEAM&gt;");
        expect(svg).toContain("THE");
        expect(svg).toContain("&quot;SLUGGERS&quot;");
    });

    it("generates LIVE badge when game has score but is not final", () => {
        const svg = generateScoreboardSvg({
            teamName: "Sliders",
            opponentName: "Raiders",
            teamScore: 5,
            opponentScore: 3,
            isGameFinal: false,
        });

        expect(svg).toContain("LIVE");
    });

    it("generates UPCOMING badge when game is 0-0 and not final", () => {
        const svg = generateScoreboardSvg({
            teamName: "Sliders",
            opponentName: "Raiders",
            teamScore: 0,
            opponentScore: 0,
            isGameFinal: false,
        });

        expect(svg).toContain("UPCOMING");
    });
});
