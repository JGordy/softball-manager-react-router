import createBattingOrder from "../createBattingOrder";

describe("createBattingOrder utility", () => {
    // Helper to create mock players
    const createPlayer = (id, gender, overrides = {}) => ({
        $id: id,
        firstName: `Player${id}`,
        lastName: `Last${id}`,
        gender,
        preferredPositions: [],
        ...overrides,
    });

    describe("without idealLineup (fallback algorithm)", () => {
        it("should return all players in the batting order", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
                createPlayer("3", "Male"),
            ];

            const result = createBattingOrder(players);

            expect(result).toHaveLength(3);
            expect(result.map((p) => p.$id)).toEqual(
                expect.arrayContaining(["1", "2", "3"]),
            );
        });

        it("should not have more than 3 consecutive male batters by default", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Male"),
                createPlayer("3", "Male"),
                createPlayer("4", "Male"),
                createPlayer("5", "Female"),
                createPlayer("6", "Male"),
            ];

            const result = createBattingOrder(players);

            // Check consecutive males never exceed 3
            let consecutiveMales = 0;
            for (const player of result) {
                if (player.gender === "Male") {
                    consecutiveMales++;
                    expect(consecutiveMales).toBeLessThanOrEqual(3);
                } else {
                    consecutiveMales = 0;
                }
            }
        });

        it("should respect custom maxConsecutiveMales option", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Male"),
                createPlayer("3", "Female"),
                createPlayer("4", "Male"),
            ];

            const result = createBattingOrder(players, {
                maxConsecutiveMales: 2,
            });

            // Check consecutive males never exceed 2
            let consecutiveMales = 0;
            for (const player of result) {
                if (player.gender === "Male") {
                    consecutiveMales++;
                    expect(consecutiveMales).toBeLessThanOrEqual(2);
                } else {
                    consecutiveMales = 0;
                }
            }
        });

        it("should handle all male players gracefully", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Male"),
                createPlayer("3", "Male"),
                createPlayer("4", "Male"),
            ];

            const result = createBattingOrder(players);

            // Should return all players even if rule is broken
            expect(result).toHaveLength(4);
        });

        it("should handle empty player array", () => {
            const result = createBattingOrder([]);

            expect(result).toEqual([]);
        });

        it("should not mutate original players array", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
            ];
            const originalLength = players.length;

            createBattingOrder(players);

            expect(players).toHaveLength(originalLength);
        });
    });

    describe("with idealLineup", () => {
        it("should order players according to idealLineup when provided as object", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
                createPlayer("3", "Male"),
            ];
            const idealLineup = { lineup: ["3", "1", "2"], reserves: [] };

            const result = createBattingOrder(players, { idealLineup });

            expect(result.map((p) => p.$id)).toEqual(["3", "1", "2"]);
        });

        it("should order players according to idealLineup when provided as JSON string", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
                createPlayer("3", "Male"),
            ];
            const idealLineup = JSON.stringify({
                lineup: ["2", "3", "1"],
                reserves: [],
            });

            const result = createBattingOrder(players, { idealLineup });

            expect(result.map((p) => p.$id)).toEqual(["2", "3", "1"]);
        });

        it("should include reserves in the order", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
                createPlayer("3", "Male"),
            ];
            const idealLineup = {
                lineup: ["2", "3"],
                reserves: ["1"],
            };

            const result = createBattingOrder(players, { idealLineup });

            expect(result.map((p) => p.$id)).toEqual(["2", "3", "1"]);
        });

        it("should only include available players from idealLineup", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("3", "Male"),
            ];
            // Player "2" is in ideal lineup but not available
            const idealLineup = { lineup: ["2", "1", "3"], reserves: [] };

            const result = createBattingOrder(players, { idealLineup });

            expect(result).toHaveLength(2);
            expect(result.map((p) => p.$id)).toEqual(["1", "3"]);
        });

        it("should add remaining players not in idealLineup at the end", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
                createPlayer("3", "Male"),
                createPlayer("4", "Female"),
            ];
            // Only players 1 and 2 are in ideal lineup
            const idealLineup = { lineup: ["2", "1"], reserves: [] };

            const result = createBattingOrder(players, { idealLineup });

            expect(result).toHaveLength(4);
            // First two should be in ideal order
            expect(result[0].$id).toBe("2");
            expect(result[1].$id).toBe("1");
            // Remaining players should be added
            expect(["3", "4"]).toContain(result[2].$id);
            expect(["3", "4"]).toContain(result[3].$id);
        });

        it("should handle invalid JSON in idealLineup gracefully", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
            ];
            const idealLineup = "invalid-json";

            // Should not throw, should fall back to original algorithm
            const result = createBattingOrder(players, { idealLineup });

            expect(result).toHaveLength(2);
        });

        it("should handle empty idealLineup object", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
            ];
            const idealLineup = { lineup: [], reserves: [] };

            const result = createBattingOrder(players, { idealLineup });

            // Should fall back to original algorithm
            expect(result).toHaveLength(2);
        });

        it("should not add duplicate players if they appear multiple times in idealLineup", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
            ];
            const idealLineup = {
                lineup: ["1", "1", "2", "1"],
                reserves: [],
            };

            const result = createBattingOrder(players, { idealLineup });

            expect(result).toHaveLength(2);
            expect(result[0].$id).toBe("1");
            expect(result[1].$id).toBe("2");
        });
    });

    describe("edge cases", () => {
        it("should handle single player", () => {
            const players = [createPlayer("1", "Male")];

            const result = createBattingOrder(players);

            expect(result).toHaveLength(1);
            expect(result[0].$id).toBe("1");
        });

        it("should handle all female players", () => {
            const players = [
                createPlayer("1", "Female"),
                createPlayer("2", "Female"),
                createPlayer("3", "Female"),
            ];

            const result = createBattingOrder(players);

            expect(result).toHaveLength(3);
        });

        it("should handle mixed options", () => {
            const players = [
                createPlayer("1", "Male"),
                createPlayer("2", "Female"),
                createPlayer("3", "Male"),
            ];

            const result = createBattingOrder(players, {
                idealLineup: { lineup: ["3", "2", "1"], reserves: [] },
                maxConsecutiveMales: 2,
            });

            expect(result.map((p) => p.$id)).toEqual(["3", "2", "1"]);
        });
    });
});
