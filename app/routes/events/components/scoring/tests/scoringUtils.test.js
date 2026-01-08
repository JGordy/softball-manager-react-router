import { getRunnerMovement } from "../scoringUtils";

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
