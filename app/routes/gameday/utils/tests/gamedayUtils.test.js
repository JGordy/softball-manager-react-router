import {
    getRunnerMovement,
    getEventDescription,
    handleWalk,
    handleRunnerResults,
} from "../gamedayUtils";

describe("getRunnerMovement", () => {
    const mockPlayerChart = [
        { $id: "p1", firstName: "Mike", lastName: "Trout" },
        { $id: "p2", firstName: "Shohei", lastName: "Ohtani" },
        { $id: "p3", firstName: "Mookie", lastName: "Betts" },
    ];

    it("should return empty array if inputs are missing", () => {
        expect(getRunnerMovement(null, mockPlayerChart)).toEqual([]);
        expect(getRunnerMovement({}, null)).toEqual([]);
    });

    it("should handle stringified JSON baseState", () => {
        const baseState = JSON.stringify({
            first: "p1",
            second: null,
            third: null,
            scored: [],
        });
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["1B: Mike T."]);
    });

    it("should handle object baseState", () => {
        const baseState = {
            first: "p1",
            second: null,
            third: null,
            scored: [],
        };
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["1B: Mike T."]);
    });

    it("should report scored runners", () => {
        const baseState = {
            first: null,
            second: null,
            third: null,
            scored: ["p1", "p2"],
        };
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["Mike T. scores", "Shohei O. scores"]);
    });

    it("should report runners on multiple bases", () => {
        const baseState = {
            first: "p1",
            second: "p2",
            third: "p3",
            scored: [],
        };
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["1B: Mike T., 2B: Shohei O., 3B: Mookie B."]);
    });

    it("should combine scored runners and base occupants", () => {
        const baseState = {
            first: "p3",
            second: null,
            third: null,
            scored: ["p1"],
        };
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["Mike T. scores", "1B: Mookie B."]);
    });

    it("should use 'Runner' for unknown player IDs", () => {
        const baseState = {
            first: "unknown_id",
            second: null,
            third: null,
            scored: ["another_unknown"],
        };
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["Runner scores", "1B: Runner"]);
    });

    it("should handle malformed JSON gracefully", () => {
        const result = getRunnerMovement("not a json", mockPlayerChart);
        expect(result).toEqual([]);
    });

    it("should handle missing specific base fields", () => {
        const baseState = {
            first: "p1",
            // second and third missing
            scored: [],
        };
        const result = getRunnerMovement(baseState, mockPlayerChart);
        expect(result).toEqual(["1B: Mike T."]);
    });
});

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
            first: "stay",
        };

        const result = handleRunnerResults(runnerResults, runners, "batterId");
        expect(result.newRunners.first).toBe("r1");
    });
});
