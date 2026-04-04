import {
    calculateWinners,
    calculateAllWinners,
    isUserAwardWinner,
} from "../awards";

describe("awards utility", () => {
    const mockVotes = {
        rows: [
            { reason: "mvp", nominated_user_id: "user-1" },
            { reason: "mvp", nominated_user_id: "user-1" },
            { reason: "mvp", nominated_user_id: "user-2" },
            { reason: "clutch", nominated_user_id: "user-2" },
            { reason: "clutch", nominated_user_id: "user-3" },
        ],
    };

    describe("calculateWinners", () => {
        it("should calculate a single winner and return tallies correctly", () => {
            const { winnerIds, maxVotes, tallies } = calculateWinners(
                mockVotes,
                "mvp",
            );
            expect(winnerIds).toEqual(["user-1"]);
            expect(maxVotes).toBe(2);
            expect(tallies).toEqual({ "user-1": 2, "user-2": 1 });
        });

        it("should calculate a tie correctly", () => {
            const { winnerIds, maxVotes } = calculateWinners(
                mockVotes,
                "clutch",
            );
            expect(winnerIds).toContain("user-2");
            expect(winnerIds).toContain("user-3");
            expect(winnerIds.length).toBe(2);
            expect(maxVotes).toBe(1);
        });

        it("should return empty results for unmatched award types", () => {
            const { winnerIds, maxVotes } = calculateWinners(
                mockVotes,
                "baserunning",
            );
            expect(winnerIds).toEqual([]);
            expect(maxVotes).toBe(0);
        });

        it("should handle mixed snake_case and camelCase nominated IDs", () => {
            const mixedVotes = {
                rows: [
                    { reason: "mvp", nominated_user_id: "user-1" },
                    { reason: "mvp", nominatedUserId: "user-1" },
                ],
            };
            const { winnerIds, maxVotes } = calculateWinners(mixedVotes, "mvp");
            expect(winnerIds).toEqual(["user-1"]);
            expect(maxVotes).toBe(2);
        });
    });

    describe("calculateAllWinners", () => {
        it("should calculate winners for all types in a single pass", () => {
            const results = calculateAllWinners(mockVotes);
            expect(results.mvp.winnerIds).toEqual(["user-1"]);
            expect(results.mvp.maxVotes).toBe(2);
            expect(results.clutch.winnerIds).toContain("user-2");
            expect(results.clutch.winnerIds).toContain("user-3");
            expect(results.clutch.maxVotes).toBe(1);
        });

        it("should return an empty object for no votes", () => {
            expect(calculateAllWinners(null)).toEqual(Object.create(null));
            expect(calculateAllWinners({ rows: [] })).toEqual(
                Object.create(null),
            );
        });
    });

    describe("isUserAwardWinner", () => {
        const mockAwards = {
            total: 1,
            rows: [{ winner_user_id: "user-1", award_type: "mvp" }],
        };

        it("should identify a winner from awards collection", () => {
            expect(isUserAwardWinner("user-1", mockAwards, mockVotes)).toBe(
                true,
            );
        });

        it("should identify a tied winner from votes when missing in awards collection", () => {
            // user-3 tied for 'clutch' but is NOT in mockAwards.rows
            expect(isUserAwardWinner("user-3", mockAwards, mockVotes)).toBe(
                true,
            );
        });

        it("should NOT identify as winner if they have fewer votes than the leader", () => {
            const singleWinnerVotes = {
                rows: [
                    { reason: "mvp", nominated_user_id: "user-1" },
                    { reason: "mvp", nominated_user_id: "user-1" },
                    { reason: "mvp", nominated_user_id: "user-2" },
                ],
            };
            // user-2 has 1 vote, user-1 has 2 votes. user-2 is NOT a winner.
            expect(
                isUserAwardWinner("user-2", mockAwards, singleWinnerVotes),
            ).toBe(false);
        });

        it("should identify as winner if they are in a tie, even if not in awards collection", () => {
            const tieVotes = {
                rows: [
                    { reason: "mvp", nominated_user_id: "user-1" },
                    { reason: "mvp", nominated_user_id: "user-2" },
                ],
            };
            // user-2 has 1 vote, user-1 has 1 vote (Tie).
            expect(isUserAwardWinner("user-2", mockAwards, tieVotes)).toBe(
                true,
            );
        });
    });
});
