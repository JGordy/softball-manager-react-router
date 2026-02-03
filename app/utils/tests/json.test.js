import { tryParsePartialLineup } from "../json";

describe("json utils - tryParsePartialLineup", () => {
    it("should return null for empty or irrelevant string", () => {
        expect(tryParsePartialLineup("")).toBe(null);
        expect(tryParsePartialLineup("some random text")).toBe(null);
    });

    it("should return null if lineup key is found but no array content yet", () => {
        expect(tryParsePartialLineup('{"lineup": [')).toBe(null);
    });

    it("should parse a simple partial array", () => {
        const input = '{"lineup": [{"id": 1}, {"id": 2}]'; // Missing closing bracket/brace for root
        // The parser adds "]" to the extracted content
        const result = tryParsePartialLineup(input);
        expect(result).toHaveLength(2);
        expect(result[1].id).toBe(2);
    });

    it("should parse up to the LAST complete object", () => {
        // Here the 3rd object is incomplete
        const input = '{"lineup": [{"id": 1}, {"id": 2}, {"id": 3, "na';
        const result = tryParsePartialLineup(input);
        expect(result).toHaveLength(2);
        expect(result[1].id).toBe(2);
    });

    it("should handle nested objects and strings correctly", () => {
        // 2nd object is incomplete (missing closing brace for the object proper? No wait)
        // {"data": "..." is open. The string quote is closed? No. "brace" ' -> check quote

        // precise test case:
        // Object 1: {"a": 1} - Complete
        // Object 2: {"b": "val}"} - Complete (brace inside string is ignored)
        // Object 3: {"c": ... unfinished

        const text = '{"lineup": [ {"a": 1}, {"b": "val}"}, {"c": ';
        const result = tryParsePartialLineup(text);
        expect(result).toHaveLength(2);
        expect(result[0].a).toBe(1);
        expect(result[1].b).toBe("val}");
    });

    it("should handle escaped quotes properly", () => {
        const text =
            '{"lineup": [ {"msg": "Hello \\"World\\""}, {"incomplete": "tr';
        const result = tryParsePartialLineup(text);
        expect(result).toHaveLength(1);
        expect(result[0].msg).toBe('Hello "World"');
    });
});
