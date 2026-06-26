import { getLineupSystemInstruction } from "../systemInstructions";

describe("getLineupSystemInstruction", () => {
    it("returns correct strategy string when lineupStrategy is 'best_first'", () => {
        const result = getLineupSystemInstruction(0, "best_first");
        expect(result).toContain(
            "Group your best hitters (determined by batting average and power) near the top",
        );
    });

    it("returns correct strategy string when lineupStrategy is 'spread'", () => {
        const result = getLineupSystemInstruction(0, "spread");
        expect(result).toContain(
            "Spread out the high average and power batters throughout the lineup",
        );
    });

    it("returns 'spread' strategy by default if lineupStrategy is not provided", () => {
        const result = getLineupSystemInstruction();
        expect(result).toContain(
            "Spread out the high average and power batters throughout the lineup",
        );
    });
});
