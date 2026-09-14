import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import { getSeasonById, getPreviousSeasonSummary } from "../seasons";

// Mock dependencies
jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((field, val) => `equal(${field},${val})`),
        limit: jest.fn((val) => `limit(${val})`),
    },
}));

jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

jest.mock("@/actions/rosterHistory", () => ({
    getSeasonRoster: jest.fn(),
}));
jest.mock("@/loaders/teams", () => ({
    getTeamById: jest.fn(),
}));

describe("Seasons Loader", () => {
    const mockSessionClient = {
        tablesDB: { id: "mock-session-db" },
        account: {
            get: jest.fn().mockResolvedValue({ $id: "user-123" }),
        },
    };
    const mockAdminClient = {
        teams: {
            listMemberships: jest.fn().mockResolvedValue({ memberships: [] }),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        const {
            createSessionClient,
            createAdminClient,
        } = require("@/utils/appwrite/server");
        createSessionClient.mockResolvedValue(mockSessionClient);
        createAdminClient.mockReturnValue(mockAdminClient);

        const { getSeasonRoster } = require("@/actions/rosterHistory");
        getSeasonRoster.mockResolvedValue([]);

        const { getTeamById } = require("@/loaders/teams");
        getTeamById.mockResolvedValue({ players: [], teamLogs: [] });
    });

    describe("getSeasonById", () => {
        it("should return season data when seasonId is provided", async () => {
            const mockSeason = {
                $id: "season1",
                name: "Fall 2023",
                teamId: "team1",
            };
            const mockTeam = { $id: "team1", name: "Team 1" };

            readDocument
                .mockResolvedValueOnce(mockSeason) // for season
                .mockResolvedValueOnce(mockTeam); // for team

            listDocuments.mockResolvedValue({ rows: [] }); // Mock games query

            const result = await getSeasonById({
                seasonId: "season1",
                client: mockSessionClient,
            });

            expect(readDocument).toHaveBeenCalledWith(
                "seasons",
                "season1",
                [],
                mockSessionClient,
            );
            expect(result.season.$id).toBe("season1");
            expect(result.season.teams[0].$id).toBe("team1");
            expect(result.isArchiveView).toBe(false);
        });

        it("should check season_rosters using adminClient if reading with session client throws error, and return isArchiveView: true on success", async () => {
            const mockSeason = {
                $id: "season1",
                name: "Fall 2023",
                teamId: "team1",
            };
            const mockTeam = { $id: "team1", name: "Team 1" };

            // User client fails with permission error
            readDocument.mockRejectedValueOnce(new Error("Permission denied"));

            // Admin client succeeds
            listDocuments
                .mockResolvedValueOnce({ rows: [{ playerId: "user-123" }] }) // for season_rosters check
                .mockResolvedValueOnce({ rows: [] }); // for games list

            readDocument
                .mockResolvedValueOnce(mockSeason) // for season read using admin client
                .mockResolvedValueOnce(mockTeam); // for team read using admin client

            const result = await getSeasonById({
                seasonId: "season1",
                client: mockSessionClient,
            });

            expect(result.isArchiveView).toBe(true);
            expect(result.season.$id).toBe("season1");
            expect(readDocument).toHaveBeenLastCalledWith(
                "teams",
                "team1",
                [],
                mockAdminClient,
            );
        });

        it("should shield PII by clearing teamPlayers and hydrating players directly from users collection if isArchiveView is true", async () => {
            const mockSeason = {
                $id: "season1",
                name: "Fall 2023",
                teamId: "team1",
            };
            const mockTeam = { $id: "team1", name: "Team 1" };

            // User client fails with permission error
            readDocument.mockRejectedValueOnce(new Error("Permission denied"));

            // Admin client succeeds
            listDocuments
                .mockResolvedValueOnce({ rows: [{ playerId: "user-123" }] }) // for season_rosters check
                .mockResolvedValueOnce({ rows: [] }) // for games list
                .mockResolvedValueOnce({
                    rows: [
                        {
                            $id: "user-123",
                            firstName: "Archived",
                            email: "archived@example.com",
                        },
                    ],
                }); // for users list

            readDocument
                .mockResolvedValueOnce(mockSeason) // for season read
                .mockResolvedValueOnce(mockTeam); // for team read

            const { getSeasonRoster } = require("@/actions/rosterHistory");
            getSeasonRoster.mockResolvedValueOnce([{ playerId: "user-123" }]);

            const result = await getSeasonById({
                seasonId: "season1",
                client: mockSessionClient,
            });

            expect(result.isArchiveView).toBe(true);
            expect(result.players).toHaveLength(1);
            expect(result.players[0].firstName).toBe("Archived");
            expect(result.teamPlayers).toEqual([]); // teamPlayers is cleared!
        });

        it("should throw original permission error if user is not in season_rosters", async () => {
            readDocument.mockRejectedValueOnce(new Error("Permission denied"));

            // No records in season_rosters
            listDocuments.mockResolvedValueOnce({ rows: [] });

            await expect(
                getSeasonById({
                    seasonId: "season1",
                    client: mockSessionClient,
                }),
            ).rejects.toThrow("Permission denied");
        });

        it("should return empty object when seasonId is missing", async () => {
            const result = await getSeasonById({
                seasonId: null,
                client: mockSessionClient,
            });

            expect(readDocument).not.toHaveBeenCalled();
            expect(result.season).toEqual({});
        });
    });

    describe("getPreviousSeasonSummary", () => {
        it("should return null if teamId or currentSeasonId is missing", async () => {
            expect(
                await getPreviousSeasonSummary({
                    teamId: null,
                    currentSeasonId: "s1",
                }),
            ).toBeNull();
            expect(
                await getPreviousSeasonSummary({
                    teamId: "t1",
                    currentSeasonId: null,
                }),
            ).toBeNull();
        });

        it("should return null if team has only one season", async () => {
            listDocuments
                .mockResolvedValueOnce({
                    rows: [{ $id: "curr-s", startDate: "2026-09-01" }],
                }) // byTeamId
                .mockResolvedValueOnce({ rows: [] }); // byTeamsArr

            const result = await getPreviousSeasonSummary({
                teamId: "team-1",
                currentSeasonId: "curr-s",
            });

            expect(result).toBeNull();
        });

        it("should correctly identify previous season, query targeted games, batch logs, and return summary", async () => {
            const currentSeason = {
                $id: "curr-s",
                startDate: "2026-09-01",
                seasonName: "Fall 2026",
            };
            const prevSeason = {
                $id: "prev-s",
                startDate: "2026-04-01",
                seasonName: "Spring 2026",
            };
            const olderSeason = {
                $id: "old-s",
                startDate: "2025-09-01",
                seasonName: "Fall 2025",
            };

            // 1. Seasons queries
            listDocuments
                .mockResolvedValueOnce({
                    rows: [currentSeason, prevSeason, olderSeason],
                }) // byTeamId
                .mockResolvedValueOnce({ rows: [] }) // byTeamsArr
                // 2. Games queries (by season, by team)
                .mockResolvedValueOnce({
                    rows: [
                        {
                            $id: "game-1",
                            seasons: "prev-s",
                            score: 10,
                            opponentScore: 6,
                        },
                        {
                            $id: "game-2",
                            seasons: "prev-s",
                            score: 12,
                            opponentScore: 8,
                        },
                    ],
                }) // games by season
                .mockResolvedValueOnce({ rows: [] }) // games by team
                // 3. Logs query (batch limit 5000)
                .mockResolvedValueOnce({
                    rows: [
                        {
                            $id: "log-1",
                            gameId: "game-1",
                            playerId: "p1",
                            eventType: "single",
                        },
                        {
                            $id: "log-2",
                            gameId: "game-2",
                            playerId: "p1",
                            eventType: "double",
                        },
                    ],
                });

            const result = await getPreviousSeasonSummary({
                teamId: "team-1",
                currentSeasonId: "curr-s",
            });

            expect(result).not.toBeNull();
            expect(result.season.$id).toBe("prev-s");
            expect(result.season.seasonName).toBe("Spring 2026");
            expect(result.games).toHaveLength(2);
            expect(result.logs).toHaveLength(2);
            expect(result.allPreviousSeasons).toHaveLength(2);
            expect(result.allPreviousSeasons.map((s) => s.$id)).toEqual([
                "prev-s",
                "old-s",
            ]);

            // Verify Query was called with 5000 limit for logs
            expect(Query.limit).toHaveBeenCalledWith(5000);
        });

        it("should handle error gracefully and return null", async () => {
            listDocuments.mockRejectedValueOnce(
                new Error("Appwrite DB connection failure"),
            );

            const result = await getPreviousSeasonSummary({
                teamId: "team-1",
                currentSeasonId: "curr-s",
            });

            expect(result).toBeNull();
        });
    });
});
