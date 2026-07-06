import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import { getSeasonById } from "../seasons";

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
            // The team should be read using the admin client
            expect(readDocument).toHaveBeenLastCalledWith(
                "teams",
                "team1",
                [],
                mockAdminClient,
            );
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
});
