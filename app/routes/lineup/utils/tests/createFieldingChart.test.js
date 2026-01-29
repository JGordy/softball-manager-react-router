import createFieldingChart from "../createFieldingChart";

describe("createFieldingChart utility", () => {
    // Helper to create mock players
    const createPlayer = (id, overrides = {}) => ({
        $id: id,
        firstName: `Player${id}`,
        lastName: `Last${id}`,
        gender: "Male",
        preferredPositions: [],
        dislikedPositions: [],
        positions: [],
        ...overrides,
    });

    describe("basic functionality", () => {
        it("should return players with positions array for each inning", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players);

            expect(result).toHaveLength(10);
            result.forEach((player) => {
                expect(player.positions).toHaveLength(7); // Default 7 innings
            });
        });

        it("should respect custom innings option", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, { innings: 5 });

            result.forEach((player) => {
                expect(player.positions).toHaveLength(5);
            });
        });

        it("should not include preferredPositions or dislikedPositions in output", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Pitcher"] }),
            ];

            const result = createFieldingChart(players, { innings: 1 });

            expect(result[0]).not.toHaveProperty("preferredPositions");
            expect(result[0]).not.toHaveProperty("dislikedPositions");
        });

        it("should preserve player identity fields", () => {
            const players = [
                createPlayer("1", {
                    firstName: "John",
                    lastName: "Doe",
                    gender: "Male",
                }),
            ];

            const result = createFieldingChart(players, { innings: 1 });

            expect(result[0].$id).toBe("1");
            expect(result[0].firstName).toBe("John");
            expect(result[0].lastName).toBe("Doe");
            expect(result[0].gender).toBe("Male");
        });
    });

    describe("position assignment without idealPositioning", () => {
        it("should assign pitcher to player with Pitcher as preferred position", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Pitcher"] }),
                createPlayer("2", { preferredPositions: ["Catcher"] }),
                ...Array.from({ length: 8 }, (_, i) =>
                    createPlayer(`${i + 3}`),
                ),
            ];

            const result = createFieldingChart(players, { innings: 1 });

            const pitcher = result.find((p) => p.$id === "1");
            expect(pitcher.positions[0]).toBe("Pitcher");
        });

        it("should assign preferred positions when available", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Shortstop"] }),
                createPlayer("2", { preferredPositions: ["Catcher"] }),
                createPlayer("3", { preferredPositions: ["First Base"] }),
                ...Array.from({ length: 7 }, (_, i) =>
                    createPlayer(`${i + 4}`),
                ),
            ];

            const result = createFieldingChart(players, { innings: 1 });

            const shortstop = result.find((p) => p.$id === "1");
            const catcher = result.find((p) => p.$id === "2");
            const firstBase = result.find((p) => p.$id === "3");

            expect(shortstop.positions[0]).toBe("Shortstop");
            expect(catcher.positions[0]).toBe("Catcher");
            expect(firstBase.positions[0]).toBe("First Base");
        });

        it('should assign "Out" to extra players when more than 10 players', () => {
            const players = Array.from({ length: 12 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, { innings: 1 });

            const outPlayers = result.filter((p) => p.positions[0] === "Out");
            expect(outPlayers.length).toBe(2);
        });
    });

    describe("with idealPositioning", () => {
        it("should prioritize team idealPositioning over player preferredPositions", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Catcher"] }),
                createPlayer("2", { preferredPositions: ["Pitcher"] }),
                ...Array.from({ length: 8 }, (_, i) =>
                    createPlayer(`${i + 3}`),
                ),
            ];

            // Team wants player 1 to pitch, even though they prefer Catcher
            const idealPositioning = {
                Pitcher: ["1"],
                Catcher: ["2"],
            };

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            const player1 = result.find((p) => p.$id === "1");
            const player2 = result.find((p) => p.$id === "2");

            expect(player1.positions[0]).toBe("Pitcher");
            expect(player2.positions[0]).toBe("Catcher");
        });

        it("should handle idealPositioning as JSON string", () => {
            const players = [
                createPlayer("1", { preferredPositions: [] }),
                ...Array.from({ length: 9 }, (_, i) =>
                    createPlayer(`${i + 2}`),
                ),
            ];

            const idealPositioning = JSON.stringify({
                Pitcher: ["1"],
            });

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            const player1 = result.find((p) => p.$id === "1");
            expect(player1.positions[0]).toBe("Pitcher");
        });

        it("should use priority order in idealPositioning array", () => {
            const players = [
                createPlayer("1"),
                createPlayer("2"),
                ...Array.from({ length: 8 }, (_, i) =>
                    createPlayer(`${i + 3}`),
                ),
            ];

            // Player 1 is first choice for pitcher, player 2 is backup
            const idealPositioning = {
                Pitcher: ["1", "2"],
            };

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            const player1 = result.find((p) => p.$id === "1");
            expect(player1.positions[0]).toBe("Pitcher");
        });

        it("should fall back to next player if first choice is unavailable", () => {
            // Player 1 is not in the available players list
            const players = [
                createPlayer("2"),
                ...Array.from({ length: 9 }, (_, i) =>
                    createPlayer(`${i + 3}`),
                ),
            ];

            const idealPositioning = {
                Pitcher: ["1", "2"], // Player 1 is first choice but unavailable
            };

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            const player2 = result.find((p) => p.$id === "2");
            expect(player2.positions[0]).toBe("Pitcher");
        });

        it("should handle invalid JSON in idealPositioning gracefully", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning: "invalid-json",
            });

            // Should not throw, should complete with positions assigned
            expect(result).toHaveLength(10);
            result.forEach((player) => {
                expect(player.positions).toHaveLength(1);
            });
        });

        it("should handle empty idealPositioning object", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Pitcher"] }),
                ...Array.from({ length: 9 }, (_, i) =>
                    createPlayer(`${i + 2}`),
                ),
            ];

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning: {},
            });

            // Should fall back to player preferences
            const player1 = result.find((p) => p.$id === "1");
            expect(player1.positions[0]).toBe("Pitcher");
        });

        it("should combine team and player preferences for positions", () => {
            const players = [
                createPlayer("1", {
                    preferredPositions: ["Catcher", "First Base"],
                }),
                createPlayer("2", { preferredPositions: ["Catcher"] }),
                ...Array.from({ length: 8 }, (_, i) =>
                    createPlayer(`${i + 3}`),
                ),
            ];

            // Team wants player 1 at Shortstop (not in their preferences)
            const idealPositioning = {
                Shortstop: ["1"],
                Catcher: ["2"],
            };

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            const player1 = result.find((p) => p.$id === "1");
            const player2 = result.find((p) => p.$id === "2");

            expect(player1.positions[0]).toBe("Shortstop");
            expect(player2.positions[0]).toBe("Catcher");
        });
    });

    describe("out rotation across innings", () => {
        it("should rotate players sitting out across innings", () => {
            const players = Array.from({ length: 12 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, { innings: 7 });

            // Count total "Out" assignments for each player
            const outCounts = result.map((player) => ({
                id: player.$id,
                outs: player.positions.filter((pos) => pos === "Out").length,
            }));

            // Each player should have a relatively equal number of outs
            const maxOuts = Math.max(...outCounts.map((p) => p.outs));
            const minOuts = Math.min(...outCounts.map((p) => p.outs));

            // Difference between max and min outs should be reasonable (at most 2)
            // With 12 players, 7 innings, and 10 positions: 14 total outs / 12 players ≈ 1-2 each
            expect(maxOuts - minOuts).toBeLessThanOrEqual(2);
        });

        it("should prioritize players who were out in previous inning", () => {
            const players = Array.from({ length: 12 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, { innings: 3 });

            // Players who were "Out" in inning 1 should be in the field in inning 2
            const outInInning1 = result.filter((p) => p.positions[0] === "Out");

            outInInning1.forEach((player) => {
                // Player should not be out in consecutive innings (if possible)
                expect(player.positions[1]).not.toBe("Out");
            });
        });
    });

    describe("edge cases", () => {
        it("should handle fewer players than positions", () => {
            const players = Array.from({ length: 8 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, { innings: 1 });

            // All players should be in the field
            const outPlayers = result.filter((p) => p.positions[0] === "Out");
            expect(outPlayers.length).toBe(0);
        });

        it("should handle exactly 10 players (no outs needed)", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const result = createFieldingChart(players, { innings: 7 });

            // No player should ever be "Out"
            result.forEach((player) => {
                player.positions.forEach((pos) => {
                    expect(pos).not.toBe("Out");
                });
            });
        });

        it("should handle single player", () => {
            const players = [createPlayer("1")];

            const result = createFieldingChart(players, { innings: 1 });

            expect(result).toHaveLength(1);
            expect(result[0].positions).toHaveLength(1);
        });

        it("should handle empty players array", () => {
            const result = createFieldingChart([], { innings: 1 });

            expect(result).toEqual([]);
        });

        it("should not mutate original players array", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Pitcher"] }),
                createPlayer("2"),
            ];
            const originalPositions = players[0].positions.length;

            createFieldingChart(players, { innings: 3 });

            expect(players[0].positions).toHaveLength(originalPositions);
        });
    });

    describe("complex scenarios", () => {
        it("should handle multiple players wanting same position", () => {
            const players = [
                createPlayer("1", { preferredPositions: ["Pitcher"] }),
                createPlayer("2", { preferredPositions: ["Pitcher"] }),
                createPlayer("3", { preferredPositions: ["Pitcher"] }),
                ...Array.from({ length: 7 }, (_, i) =>
                    createPlayer(`${i + 4}`),
                ),
            ];

            const result = createFieldingChart(players, { innings: 1 });

            // Only one player should be pitcher
            const pitchers = result.filter((p) => p.positions[0] === "Pitcher");
            expect(pitchers).toHaveLength(1);
        });

        it("should handle team positioning with multiple positions per player", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            // Player 1 can play multiple positions according to team
            const idealPositioning = {
                Pitcher: ["1", "2"],
                Catcher: ["1", "3"],
                Shortstop: ["1", "4"],
            };

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            // Player 1 should get their first team-assigned position (Pitcher)
            const player1 = result.find((p) => p.$id === "1");
            expect(player1.positions[0]).toBe("Pitcher");
        });

        it("should fill all positions when idealPositioning only covers some", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`, {
                    preferredPositions:
                        i === 0 ? ["Right Field"] : ["Left Field"],
                }),
            );

            const idealPositioning = {
                Pitcher: ["1"],
                Catcher: ["2"],
            };

            const result = createFieldingChart(players, {
                innings: 1,
                idealPositioning,
            });

            // All 10 positions should be filled
            const assignedPositions = result.map((p) => p.positions[0]);
            const uniquePositions = new Set(assignedPositions);

            expect(uniquePositions.size).toBe(10);
            expect(assignedPositions).not.toContain("Out");
        });
    });

    describe("locked players (Never Sub)", () => {
        it("should keep locked players in their position for all innings", () => {
            const players = Array.from({ length: 12 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            // Lock Player 1 to Pitcher
            const idealPositioning = {
                Pitcher: [{ id: "1", neverSub: true }],
            };

            const result = createFieldingChart(players, {
                innings: 5,
                idealPositioning,
            });

            const player1 = result.find((p) => p.$id === "1");

            // Check every inning
            player1.positions.forEach((pos) => {
                expect(pos).toBe("Pitcher");
            });
        });

        it("should not rotate locked players out even if they exceed max innings", () => {
            // 15 players for 10 spots = everyone should sit 1-2 times in 3 innings
            const players = Array.from({ length: 15 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            // Lock Player 1 to Catcher
            const idealPositioning = {
                Catcher: [{ id: "1", neverSub: true }],
            };

            const result = createFieldingChart(players, {
                innings: 7,
                idealPositioning,
            });

            const player1 = result.find((p) => p.$id === "1");

            // Should be Catcher every time, never "Out"
            expect(player1.positions).not.toContain("Out");
            expect(player1.positions.every((p) => p === "Catcher")).toBe(true);

            // Other players should have "Out" positions
            const otherPlayer = result.find((p) => p.$id === "2");
            expect(otherPlayer.positions).toContain("Out");
        });

        it("should handle multiple locked players correctly", () => {
            const players = Array.from({ length: 12 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const idealPositioning = {
                Pitcher: [{ id: "1", neverSub: true }],
                Catcher: [{ id: "2", neverSub: true }],
                Shortstop: [{ id: "3", neverSub: true }],
            };

            const result = createFieldingChart(players, {
                innings: 3,
                idealPositioning,
            });

            const p1 = result.find((p) => p.$id === "1");
            const p2 = result.find((p) => p.$id === "2");
            const p3 = result.find((p) => p.$id === "3");

            expect(p1.positions.every((p) => p === "Pitcher")).toBe(true);
            expect(p2.positions.every((p) => p === "Catcher")).toBe(true);
            expect(p3.positions.every((p) => p === "Shortstop")).toBe(true);
        });

        it("should support mixed legacy (string) and new (object) formats in idealPositioning", () => {
            const players = Array.from({ length: 12 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            const idealPositioning = {
                Pitcher: [{ id: "1", neverSub: true }], // New format
                Catcher: ["2"], // Legacy format
                FirstBase: [{ id: "3", neverSub: false }, "4"], // Mixed
            };

            const result = createFieldingChart(players, {
                innings: 3,
                idealPositioning,
            });

            // Locked player works
            const p1 = result.find((p) => p.$id === "1");
            expect(p1.positions.every((p) => p === "Pitcher")).toBe(true);

            // Legacy format player gets priority assign ( inning 1)
            const p2 = result.find((p) => p.$id === "2");
            expect(p2.positions[0]).toBe("Catcher");

            // Mixed format works
            const p3 = result.find((p) => p.$id === "3");
            const p4 = result.find((p) => p.$id === "4");

            // Both should likely get assigned to First Base at some point or consistently if no conflict
            // Just verifying no crash and they exist in output
            expect(p3).toBeDefined();
            expect(p4).toBeDefined();
        });

        it("should ignore locked players not present in player list", () => {
            const players = Array.from({ length: 10 }, (_, i) =>
                createPlayer(`${i + 1}`),
            );

            // Lock ID "99" which doesn't exist
            const idealPositioning = {
                Pitcher: [{ id: "99", neverSub: true }],
            };

            // Should run without error
            const result = createFieldingChart(players, {
                innings: 3,
                idealPositioning,
            });

            expect(result).toHaveLength(10);

            // Pitcher should still be assigned to someone else
            const p1Assignment = result[0].positions[0];
            expect(p1Assignment).toBeDefined();
        });
    });
});
