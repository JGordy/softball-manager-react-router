import {
    getEventDescription,
    handleWalk,
    handleRunnerResults,
} from "../scoringUtils";

describe("getEventDescription", () => {
    it("should format single correctly", () => {
        expect(getEventDescription("1B", "Joseph", "LF")).toBe(
            "Joseph singles to LF",
        );
    });

    it("should format strikeout correctly", () => {
        expect(getEventDescription("K", "Joseph")).toBe("Joseph strikes out");
    });

    it("should fallback to generic format for unknown codes", () => {
        expect(getEventDescription("XYZ", "Joseph", "SS")).toBe(
            "Joseph: XYZ (SS)",
        );
    });
});

describe("handleWalk", () => {
    it("should advance batter to first", () => {
        const runners = { first: null, second: null, third: null };
        const result = handleWalk(runners, "batterId");

        expect(result.newRunners.first).toBe("batterId");
        expect(result.newRunners.scored).toHaveLength(0);
    });

    it("should force R1 to 2nd", () => {
        const runners = { first: "r1", second: null, third: null };
        const result = handleWalk(runners, "batterId");

        expect(result.newRunners.first).toBe("batterId");
        expect(result.newRunners.second).toBe("r1");
    });

    it("should force home only if bases loaded", () => {
        const runners = { first: "r1", second: "r2", third: "r3" };
        const result = handleWalk(runners, "batterId");

        expect(result.newRunners.first).toBe("batterId");
        expect(result.newRunners.second).toBe("r1");
        expect(result.newRunners.third).toBe("r2");
        expect(result.newRunners.scored).toContain("r3");
        expect(result.runsOnPlay).toBe(1);
    });

    it("should NOT force home if 3rd base occupied but 1st/2nd empty", () => {
        const runners = { first: null, second: null, third: "r3" };
        const result = handleWalk(runners, "batterId");

        expect(result.newRunners.first).toBe("batterId");
        expect(result.newRunners.second).toBeNull();
        expect(result.newRunners.third).toBe("r3"); // Stays
        expect(result.newRunners.scored).toHaveLength(0);
    });
});

describe("handleRunnerResults", () => {
    it("should process batter scoring", () => {
        const runnerResults = { batter: "score" };
        const runners = { first: null, second: null, third: null };
        const result = handleRunnerResults(runnerResults, runners, "batterId");

        expect(result.newRunners.scored).toContain("batterId");
        expect(result.runsOnPlay).toBe(1);
    });

    it("should process outs", () => {
        const runnerResults = { batter: "out" };
        const runners = { first: null, second: null, third: null };
        const result = handleRunnerResults(runnerResults, runners, "batterId");

        expect(result.outsRecorded).toBe(1);
        expect(result.newRunners.first).toBeNull();
    });

    it("should process existing runner movement", () => {
        const runners = { first: "r1", second: null, third: null };
        const runnerResults = {
            batter: "first",
            first: "third",
        };
        const result = handleRunnerResults(runnerResults, runners, "batterId");

        expect(result.newRunners.first).toBe("batterId");
        expect(result.newRunners.third).toBe("r1");
    });

    it("should handle 'stay' for existing runners", () => {
        const runners = { first: "r1", second: null, third: null };
        const runnerResults = {
            batter: "first", // Batter to 1st
            first: "stay", // R1 stays at 1st?? (logic might overwrite if key maps to same base? Let's check impl)
        };
        // In reality, R1 stay at 1st while Batter goes to 1st is invalid baseball, but logic should handle it as instructed.
        // Implementation:
        // Batter -> newRunners.first = batterId
        // Loop bases:
        //   First: result='stay' -> newRunners.first = 'r1'
        // So R1 overwrites Batter at first base in the object.

        const result = handleRunnerResults(runnerResults, runners, "batterId");
        expect(result.newRunners.first).toBe("r1");
    });
});
