import { sortAchievements, RARITY_WEIGHTS } from "../achievements";

describe("achievements utility (client)", () => {
    const mockAchievements = [
        {
            $id: "ua1",
            $createdAt: "2024-01-01T10:00:00Z",
            achievement: { rarity: "Common", name: "Old Common" },
        },
        {
            $id: "ua2",
            $createdAt: "2024-01-02T10:00:00Z",
            achievement: { rarity: "Common", name: "New Common" },
        },
        {
            $id: "ua3",
            $createdAt: "2024-01-01T12:00:00Z",
            achievement: { rarity: "Legendary", name: "Legendary Achievement" },
        },
        {
            $id: "ua4",
            $createdAt: "2024-01-01T11:00:00Z",
            achievement: { rarity: "Epic", name: "Epic Achievement" },
        },
    ];

    describe("RARITY_WEIGHTS", () => {
        it("should define weights in correct priority order", () => {
            expect(RARITY_WEIGHTS.legendary).toBeGreaterThan(
                RARITY_WEIGHTS.epic,
            );
            expect(RARITY_WEIGHTS.epic).toBeGreaterThan(RARITY_WEIGHTS.rare);
            expect(RARITY_WEIGHTS.rare).toBeGreaterThan(
                RARITY_WEIGHTS.uncommon,
            );
            expect(RARITY_WEIGHTS.uncommon).toBeGreaterThan(
                RARITY_WEIGHTS.common,
            );
        });
    });

    describe("sortAchievements", () => {
        it("should sort by rarity first (descending)", () => {
            const sorted = sortAchievements(mockAchievements);
            expect(sorted[0].achievement.rarity).toBe("Legendary");
            expect(sorted[1].achievement.rarity).toBe("Epic");
            expect(sorted[2].achievement.rarity).toBe("Common");
        });

        it("should sort by date second (descending) for items with same rarity", () => {
            const sorted = sortAchievements(mockAchievements);
            const common1 = sorted[2];
            const common2 = sorted[3];

            expect(common1.$id).toBe("ua2"); // Newest common first
            expect(common2.$id).toBe("ua1");
        });

        it("should handle empty or missing achievements array", () => {
            expect(sortAchievements([])).toEqual([]);
            expect(sortAchievements(undefined)).toEqual([]);
        });

        it("should handle missing rarity by defaulting to common", () => {
            const mixed = [
                { $id: "1", achievement: { name: "No Rarity" } },
                { $id: "2", achievement: { rarity: "Epic", name: "Epic" } },
            ];
            const sorted = sortAchievements(mixed);
            expect(sorted[0].achievement.rarity).toBe("Epic");
            expect(sorted[1].achievement.name).toBe("No Rarity");
        });
    });
});
