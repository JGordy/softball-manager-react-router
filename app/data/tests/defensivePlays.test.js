import {
    DEFENSIVE_PLAYS,
    PLAY_CATEGORIES,
    PLAY_SUBCATEGORIES,
    getPlayById,
    getPlaysByCategory,
    getPlayStats,
} from "../defensivePlays";

describe("Defensive Plays Situational Matrix", () => {
    const EXPECTED_POSITIONS = [
        "P",
        "C",
        "1B",
        "2B",
        "3B",
        "SS",
        "LF",
        "LC",
        "RC",
        "RF",
    ];
    const VALID_PRIORITIES = ["primary", "cutoff", "coverage", "backup"];

    it("exports a comprehensive dataset of at least 70 plays", () => {
        expect(Array.isArray(DEFENSIVE_PLAYS)).toBe(true);
        expect(DEFENSIVE_PLAYS.length).toBeGreaterThanOrEqual(70);
    });

    it("exports valid PLAY_CATEGORIES and PLAY_SUBCATEGORIES", () => {
        expect(PLAY_CATEGORIES).toContain("Bases Empty");
        expect(PLAY_CATEGORIES).toContain("Runner on 1st");
        expect(PLAY_CATEGORIES).toContain("Scoring Position");
        expect(PLAY_CATEGORIES).toContain("Runners on 1st & 2nd");
        expect(PLAY_CATEGORIES).toContain("First & Third");
        expect(PLAY_CATEGORIES).toContain("Bases Loaded");

        expect(PLAY_SUBCATEGORIES).toContain("Base Hit");
        expect(PLAY_SUBCATEGORIES).toContain("Extra Bases");
        expect(PLAY_SUBCATEGORIES).toContain("Double Play");
        expect(PLAY_SUBCATEGORIES).toContain("Fly Ball / Tag");
        expect(PLAY_SUBCATEGORIES).toContain("Infield Grounder");
    });

    it("strictly conforms each scenario to the required playbook schema", () => {
        const idSet = new Set();

        DEFENSIVE_PLAYS.forEach((play, index) => {
            const playContext = `Play #${index + 1} (${play.id || "MISSING_ID"})`;

            // Unique ID and Title
            expect(typeof play.id).toBe("string");
            expect(play.id.length).toBeGreaterThan(0);
            expect(idSet.has(play.id)).toBe(false);
            idSet.add(play.id);

            expect(typeof play.title).toBe("string");
            expect(play.title.length).toBeGreaterThan(0);

            // Category and SubCategory
            expect(PLAY_CATEGORIES).toContain(play.category);
            expect(PLAY_SUBCATEGORIES).toContain(play.subCategory);

            // Tags
            expect(Array.isArray(play.tags)).toBe(true);
            expect(play.tags.length).toBeGreaterThan(0);

            // Situation
            expect(play.situation).toBeDefined();
            expect([0, 1, 2]).toContain(play.situation.outs);
            expect(Array.isArray(play.situation.runners)).toBe(true);
            play.situation.runners.forEach((runner) => {
                expect(["1B", "2B", "3B"]).toContain(runner);
            });
            expect(["L", "R"]).toContain(play.situation.batterHand);
            expect(typeof play.situation.hitType).toBe("string");
            expect(play.situation.hitType.length).toBeGreaterThan(0);
            expect(typeof play.situation.description).toBe("string");
            expect(play.situation.description.length).toBeGreaterThan(0);

            // Ball Timeline
            expect(Array.isArray(play.ballTimeline)).toBe(true);
            expect(play.ballTimeline.length).toBeGreaterThanOrEqual(2);
            play.ballTimeline.forEach((pt) => {
                expect(typeof pt.step).toBe("number");
                expect(pt.step).toBeGreaterThanOrEqual(0);
                expect(pt.step).toBeLessThanOrEqual(1);

                expect(typeof pt.pos?.x).toBe("number");
                expect(pt.pos.x).toBeGreaterThanOrEqual(0);
                expect(pt.pos.x).toBeLessThanOrEqual(100);

                expect(typeof pt.pos?.y).toBe("number");
                expect(pt.pos.y).toBeGreaterThanOrEqual(0);
                expect(pt.pos.y).toBeLessThanOrEqual(100);

                expect(typeof pt.label).toBe("string");
                expect(pt.label.length).toBeGreaterThan(0);
            });

            // Fielders: Must include all 10 positions in order
            expect(Array.isArray(play.fielders)).toBe(true);
            expect(play.fielders.length).toBe(10);

            const posIds = play.fielders.map((f) => f.posId);
            expect(posIds).toEqual(EXPECTED_POSITIONS);

            play.fielders.forEach((fielder) => {
                expect(typeof fielder.label).toBe("string");
                expect(fielder.label.length).toBeGreaterThan(0);

                expect(typeof fielder.target?.x).toBe("number");
                expect(fielder.target.x).toBeGreaterThanOrEqual(0);
                expect(fielder.target.x).toBeLessThanOrEqual(100);

                expect(typeof fielder.target?.y).toBe("number");
                expect(fielder.target.y).toBeGreaterThanOrEqual(0);
                expect(fielder.target.y).toBeLessThanOrEqual(100);

                expect(typeof fielder.role).toBe("string");
                expect(fielder.role.length).toBeGreaterThan(0);

                expect(VALID_PRIORITIES).toContain(fielder.priority);

                expect(typeof fielder.notes).toBe("string");
                expect(fielder.notes.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Helper Functions", () => {
        it("getPlayById retrieves the correct play or null", () => {
            const firstPlay = DEFENSIVE_PLAYS[0];
            const found = getPlayById(firstPlay.id);
            expect(found).toEqual(firstPlay);

            expect(getPlayById("non-existent-id")).toBeNull();
            expect(getPlayById("")).toBeNull();
            expect(getPlayById(null)).toBeNull();
        });

        it("getPlaysByCategory returns all plays for a category", () => {
            const emptyPlays = getPlaysByCategory("Bases Empty");
            expect(emptyPlays.length).toBeGreaterThan(0);
            expect(emptyPlays.every((p) => p.category === "Bases Empty")).toBe(
                true,
            );

            expect(getPlaysByCategory("Invalid Category")).toEqual([]);
        });

        it("getPlayStats computes accurate aggregates", () => {
            const stats = getPlayStats();
            expect(stats.total).toBe(DEFENSIVE_PLAYS.length);
            expect(stats.byCategory["Bases Empty"]).toBeGreaterThan(0);
            expect(stats.byCategory["Bases Loaded"]).toBeGreaterThan(0);
            expect(stats.bySubCategory["Double Play"]).toBeGreaterThan(0);
        });
    });
});
