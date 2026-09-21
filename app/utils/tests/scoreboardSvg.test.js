import { generateScoreboardSvg, getLogoDataUri } from "../scoreboardSvg";

describe("scoreboardSvg utils", () => {
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
            venue: "Grant Park",
            seasonName: "Fall 2026 Season",
            inningText: "7 Innings",
        });

        expect(svg).toContain('width="1200"');
        expect(svg).toContain('height="630"');
        expect(svg).toContain("#111827"); // midnight navy
        expect(svg).toContain("#CCFF33"); // neon volt
        expect(svg).toContain("FINAL");
        expect(svg).toContain("ORMEWOOD PARK SLIDERS");
        expect(svg).toContain("DECATUR RAIDERS");
        expect(svg).toContain(">14<");
        expect(svg).toContain(">8<");
        expect(svg).toContain("Grant Park");
        expect(svg).toContain("Fall 2026 Season");
    });

    it("handles XML characters safely by escaping them", () => {
        const svg = generateScoreboardSvg({
            teamName: "AT&T <Team>",
            opponentName: 'The "Sluggers"',
            teamScore: 3,
            opponentScore: 2,
        });

        expect(svg).toContain("AT&amp;T &lt;TEAM&gt;");
        expect(svg).toContain("THE &quot;SLUGGERS&quot;");
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
