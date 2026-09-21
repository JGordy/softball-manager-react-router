import { buildGamedayMeta, truncateCleanly } from "../gamedayMeta";

describe("gamedayMeta utils", () => {
    describe("truncateCleanly", () => {
        it("returns empty string for falsy input", () => {
            expect(truncateCleanly("")).toBe("");
            expect(truncateCleanly(null)).toBe("");
            expect(truncateCleanly(undefined)).toBe("");
        });

        it("returns input as-is if within max length", () => {
            expect(truncateCleanly("Short sentence.", 50)).toBe(
                "Short sentence.",
            );
        });

        it("truncates at word boundary with ellipsis", () => {
            const longText =
                "The Sliders took home an incredible victory after hitting multiple home runs in the late innings against their rivals.";
            const truncated = truncateCleanly(longText, 45);
            expect(truncated.endsWith("...")).toBe(true);
            expect(truncated.length).toBeLessThanOrEqual(48);
            expect(truncated).not.toContain("  ");
        });
    });

    describe("buildGamedayMeta", () => {
        const baseGame = {
            $id: "game-123",
            opponent: "Decatur Raiders",
            gameDate: "2026-07-15T19:00:00.000Z",
            location: "Grant Park",
        };
        const teams = [{ name: "Ormewood Park Sliders" }];
        const season = { name: "Fall 2026", location: "Grant Park" };

        it("returns empty array if no game provided", () => {
            expect(buildGamedayMeta({ game: null })).toEqual([]);
        });

        it("formats metadata for a FINAL game with home win (Option B)", () => {
            const meta = buildGamedayMeta({
                game: {
                    ...baseGame,
                    gameFinal: true,
                    score: 14,
                    opponentScore: 8,
                    recap: "Sliders seal a dominant 14-8 victory over the Raiders.",
                },
                teams,
                season,
                origin: "https://rostrhq.app",
            });

            const titleItem = meta.find((m) => m.property === "og:title");
            expect(titleItem.content).toBe(
                "Final: Ormewood Park Sliders Win 14-8 vs Decatur Raiders | RostrHQ",
            );

            const descItem = meta.find((m) => m.property === "og:description");
            expect(descItem.content).toBe(
                "Sliders seal a dominant 14-8 victory over the Raiders.",
            );

            const imageItem = meta.find((m) => m.property === "og:image");
            expect(imageItem.content).toBe(
                "https://rostrhq.app/api/og/game/game-123.png",
            );

            const twitterCard = meta.find((m) => m.name === "twitter:card");
            expect(twitterCard.content).toBe("summary_large_image");
        });

        it("formats metadata for a FINAL game with opponent win", () => {
            const meta = buildGamedayMeta({
                game: {
                    ...baseGame,
                    gameFinal: true,
                    score: 5,
                    opponentScore: 10,
                },
                teams,
                season,
                origin: "https://rostrhq.app",
            });

            const titleItem = meta.find((m) => m.property === "og:title");
            expect(titleItem.content).toBe(
                "Final: Decatur Raiders Defeat Ormewood Park Sliders 10-5 | RostrHQ",
            );

            const descItem = meta.find((m) => m.property === "og:description");
            expect(descItem.content).toContain(
                "Final Score: Ormewood Park Sliders 5, Decatur Raiders 10 at Grant Park",
            );
        });

        it("formats metadata for a FINAL game with a tie", () => {
            const meta = buildGamedayMeta({
                game: {
                    ...baseGame,
                    gameFinal: true,
                    score: 7,
                    opponentScore: 7,
                },
                teams,
                season,
            });

            const titleItem = meta.find((m) => m.property === "og:title");
            expect(titleItem.content).toBe(
                "Final: Ormewood Park Sliders 7, Decatur Raiders 7 (Tie) | RostrHQ",
            );
        });

        it("formats metadata for a LIVE gameday with active scores", () => {
            const meta = buildGamedayMeta({
                game: {
                    ...baseGame,
                    gameFinal: false,
                    score: 4,
                    opponentScore: 2,
                },
                teams,
                season,
                isGamedayView: true,
            });

            const titleItem = meta.find((m) => m.property === "og:title");
            expect(titleItem.content).toBe(
                "Live: Ormewood Park Sliders 4, Decatur Raiders 2 | RostrHQ",
            );

            const descItem = meta.find((m) => m.property === "og:description");
            expect(descItem.content).toContain(
                "Live softball scoring from Grant Park: Ormewood Park Sliders vs Decatur Raiders.",
            );
        });

        it("formats metadata for an upcoming scheduled game on gameday view", () => {
            const meta = buildGamedayMeta({
                game: {
                    ...baseGame,
                    gameFinal: false,
                    score: 0,
                    opponentScore: 0,
                },
                teams,
                season,
                isGamedayView: true,
            });

            const titleItem = meta.find((m) => m.property === "og:title");
            expect(titleItem.content).toBe(
                "Live Gameday: Ormewood Park Sliders vs Decatur Raiders | RostrHQ",
            );
        });

        it("formats metadata for an upcoming scheduled game on event details view", () => {
            const meta = buildGamedayMeta({
                game: {
                    ...baseGame,
                    gameFinal: false,
                },
                teams,
                season,
                isGamedayView: false,
            });

            const titleItem = meta.find((m) => m.property === "og:title");
            expect(titleItem.content).toContain(
                "Ormewood Park Sliders vs Decatur Raiders",
            );

            const descItem = meta.find((m) => m.property === "og:description");
            expect(descItem.content).toContain(
                "Live score, rosters, and lineups for Ormewood Park Sliders vs Decatur Raiders",
            );
        });
    });
});
