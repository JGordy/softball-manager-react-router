import { calculateWinners, isUserAwardWinner } from "../awards";

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
        it("should calculate a single winner correctly", () => {
            const { winnerIds, maxVotes } = calculateWinners(mockVotes, "mvp");
            expect(winnerIds).toEqual(["user-1"]);
            expect(maxVotes).toBe(2);
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

        it("should NOT identify as winner if not in awards and not highest votes", () => {
            const lowVotes = {
                rows: [
                    { reason: "mvp", nominated_user_id: "user-1" },
                    { reason: "mvp", nominated_user_id: "user-2" },
                ],
            };
            // user-2 has 1 vote, user-1 has 1 vote (Tie). Wait.
            const results = calculateWinners(lowVotes, "mvp");
            expect(results.winnerIds).toContain("user-2"); // user-2 IS a tied winner here

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
    });
});
