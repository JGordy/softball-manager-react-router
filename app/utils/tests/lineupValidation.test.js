import { sanitizeReasoning, validateLineup } from "../lineupValidation";

describe("lineupValidation utils", () => {
    describe("sanitizeReasoning", () => {
        it("should return the original string if no IDs present", () => {
            const input = "This is a normal reasoning string.";
            expect(sanitizeReasoning(input)).toBe(input);
        });

        it("should remove Appwrite-style IDs", () => {
            const input = "Player [ID: 64f1a2b3c4d5e6f7a8b9] is good at SS.";
            // Note: internal whitespace might remain depending on implementation, but ID is gone.
            expect(
                sanitizeReasoning(input).includes("64f1a2b3c4d5e6f7a8b9"),
            ).toBe(false);
        });

        it("should handle ID: prefix variations", () => {
            const input = "ID: abcdef1234567890abcd matches well.";
            expect(
                sanitizeReasoning(input).includes("abcdef1234567890abcd"),
            ).toBe(false);
        });

        it("should handle $id: variations", () => {
            const input = "Player with $id: 'abcdef1234567890abcd'";
            expect(
                sanitizeReasoning(input).includes("abcdef1234567890abcd"),
            ).toBe(false);
        });

        it("should return undefined/null if input is nullish", () => {
            expect(sanitizeReasoning(null)).toBe(null);
            expect(sanitizeReasoning(undefined)).toBe(undefined);
        });
    });

    describe("validateLineup", () => {
        const players = [
            {
                $id: "p1",
                firstName: "A",
                lastName: "B",
                gender: "M",
                bats: "R",
            },
            {
                $id: "p2",
                firstName: "C",
                lastName: "D",
                gender: "F",
                bats: "L",
            },
        ];

        it("should return successfully validated lineup", () => {
            const generated = [
                {
                    $id: "p1",
                    firstName: "A",
                    lastName: "B",
                    gender: "M",
                    bats: "R",
                    positions: Array(7).fill("LF"),
                },
                {
                    $id: "p2",
                    firstName: "C",
                    lastName: "D",
                    gender: "F",
                    bats: "L",
                    positions: Array(7).fill("RF"),
                },
            ];

            const result = validateLineup(generated, players);
            expect(result).toHaveLength(2);
            expect(result[0].$id).toBe("p1");
        });

        it("should throw if generated lineup is not an array", () => {
            expect(() => validateLineup({}, players)).toThrow(
                "AI response does not match expected lineup format",
            );
        });

        it("should throw if generated lineup is an empty array", () => {
            expect(() => validateLineup([], players)).toThrow(
                "AI response does not match expected lineup format",
            );
        });

        it("should throw if duplicate player IDs exist", () => {
            const generated = [
                { $id: "p1", positions: Array(7).fill("LF") },
                { $id: "p1", positions: Array(7).fill("RF") },
            ];
            expect(() => validateLineup(generated, players)).toThrow(
                "duplicate player IDs",
            );
        });

        it("should throw if generated lineup has players not in input", () => {
            const generated = [{ $id: "p3", positions: Array(7).fill("LF") }];
            expect(() => validateLineup(generated, players)).toThrow(
                "Generated lineup does not contain the same number",
            ); // p3 is unknown
        });

        it("should throw if generated lineup is missing players from input", () => {
            const generated = [{ $id: "p1", positions: Array(7).fill("LF") }];
            // p2 is missing
            expect(() => validateLineup(generated, players)).toThrow(
                "Generated lineup does not contain the same number",
            );
        });

        it("should throw if positions array is invalid", () => {
            const generated = [
                { $id: "p1", positions: ["LF"] }, // Not 7 items
                { $id: "p2", positions: Array(7).fill("RF") },
            ];
            expect(() => validateLineup(generated, players)).toThrow(
                "Invalid positions array",
            );
        });

        describe("with autoRepair option", () => {
            it("should pad positions to 7 if fewer than 7", () => {
                const generated = [
                    { $id: "p1", positions: ["LF", "CF"] },
                    { $id: "p2", positions: Array(7).fill("RF") },
                ];
                const result = validateLineup(generated, players, {
                    autoRepair: true,
                });
                expect(result[0].positions).toHaveLength(7);
                expect(result[0].positions.slice(0, 2)).toEqual(["LF", "CF"]);
                expect(result[0].positions.slice(2)).toEqual([
                    "Out",
                    "Out",
                    "Out",
                    "Out",
                    "Out",
                ]);
            });

            it("should truncate positions if more than 7", () => {
                const generated = [
                    { $id: "p1", positions: Array(10).fill("LF") },
                    { $id: "p2", positions: Array(7).fill("RF") },
                ];
                const result = validateLineup(generated, players, {
                    autoRepair: true,
                });
                expect(result[0].positions).toHaveLength(7);
            });

            it("should deduplicate player IDs by keeping the first occurrence", () => {
                const generated = [
                    { $id: "p1", positions: Array(7).fill("LF") },
                    { $id: "p1", positions: Array(7).fill("RF") },
                ];
                const result = validateLineup(generated, players, {
                    autoRepair: true,
                });
                expect(result).toHaveLength(2); // p1 kept, missing p2 appended
                expect(result[0].$id).toBe("p1");
                expect(result[1].$id).toBe("p2");
                expect(result[1].positions).toEqual(Array(7).fill("Out"));
            });

            it("should auto-append missing players from roster to end of order", () => {
                const generated = [
                    { $id: "p1", positions: Array(7).fill("LF") },
                ];
                const result = validateLineup(generated, players, {
                    autoRepair: true,
                });
                expect(result).toHaveLength(2);
                expect(result[0].$id).toBe("p1");
                expect(result[1].$id).toBe("p2");
                expect(result[1].firstName).toBe("C");
                expect(result[1].positions).toEqual(Array(7).fill("Out"));
            });

            it("should drop unknown players not on roster", () => {
                const generated = [
                    { $id: "unknown", positions: Array(7).fill("P") },
                    { $id: "p1", positions: Array(7).fill("LF") },
                ];
                const result = validateLineup(generated, players, {
                    autoRepair: true,
                });
                expect(result.some((p) => p.$id === "unknown")).toBe(false);
                expect(result.some((p) => p.$id === "p1")).toBe(true);
                expect(result.some((p) => p.$id === "p2")).toBe(true);
            });
        });
    });
});
