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

    it("should include advancement context if batter moves further than expected on error", () => {
        const runnerResults = { batter: "second" };
        expect(getEventDescription("E", "Joseph", "RF", runnerResults)).toBe(
            "Joseph reaches on an error by RF and advances to second on the play",
        );
    });

    it("should include advancement context if batter moves further than expected on hits", () => {
        const runnerResults = { batter: "third" };
        expect(getEventDescription("1B", "Joseph", "LF", runnerResults)).toBe(
            "Joseph singles to LF and advances to third on error",
        );
    });

    it("should include out context if batter out on hit play", () => {
        const runnerResults = { batter: "out" };
        expect(getEventDescription("1B", "Joseph", "LF", runnerResults)).toBe(
            "Joseph singles to LF and is out on the play",
        );
    });

    it("should use hitLocation for description when provided", () => {
        expect(
            getEventDescription("1B", "Joseph", "LF", null, "deep left field"),
        ).toBe("Joseph singles to deep left field");
    });

    it("should use hitLocation in parentheses for errors", () => {
        expect(
            getEventDescription(
                "E",
                "Joseph",
                "LF",
                null,
                "shallow left field",
            ),
        ).toBe("Joseph reaches on an error by LF (shallow left field)");
    });

    it("should include hit description when provided for extra base hits", () => {
        const result = getEventDescription(
            "2B",
            "Joseph",
            "LF",
            null,
            "deep left-center gap",
        );
        expect(result).toBe("Joseph doubles to deep left-center gap");
    });

    it("should format errors with both position and hit location", () => {
        const result = getEventDescription(
            "E",
            "Joseph",
            "SS",
            null,
            "to shortstop",
        );
        expect(result).toBe("Joseph reaches on an error by SS (to shortstop)");
    });

    it("should include hit description for outs", () => {
        const result = getEventDescription(
            "Fly Out",
            "Joseph",
            "CF",
            null,
            "deep center field",
        );
        expect(result).toBe("Joseph flies out to deep center field");
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
