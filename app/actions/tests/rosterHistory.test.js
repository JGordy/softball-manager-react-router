import {
    addPlayersToSeasonRoster,
    updateSeasonRoster,
    getSeasonRoster,
} from "../rosterHistory";
import {
    createDocument,
    listDocuments,
    deleteDocument,
} from "@/utils/databases";

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(() => "admin-client-mock"),
}));

jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
    deleteDocument: jest.fn(),
}));

// Mock node-appwrite
jest.mock("node-appwrite", () => {
    const Query = {
        equal: jest.fn((field, val) => `equal(${field},${val})`),
        limit: jest.fn((val) => `limit(${val})`),
    };
    const Permission = {
        read: jest.fn((role) => `read:${role}`),
        update: jest.fn((role) => `update:${role}`),
        delete: jest.fn((role) => `delete:${role}`),
    };
    const Role = {
        team: jest.fn(
            (teamId, subrole) =>
                `team:${teamId}${subrole ? `:${subrole}` : ""}`,
        ),
        user: jest.fn((userId) => `user:${userId}`),
    };
    const ID = {
        unique: jest.fn(() => "unique()"),
    };
    return { Query, Permission, Role, ID };
});

describe("rosterHistory Actions", () => {
    const mockClient = {};
    const teamId = "team-123";
    const seasonId = "season-456";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("addPlayersToSeasonRoster", () => {
        it("should return success immediately if no playerIds are provided", async () => {
            const result = await addPlayersToSeasonRoster({
                playerIds: [],
                teamId,
                seasonId,
                client: mockClient,
            });
            expect(result).toEqual({ success: true });
            expect(createDocument).not.toHaveBeenCalled();
        });

        it("should create season_roster documents for each player with correct permissions", async () => {
            createDocument.mockResolvedValue({ $id: "doc-1" });

            const playerIds = ["player-1", "player-2"];
            const result = await addPlayersToSeasonRoster({
                playerIds,
                teamId,
                seasonId,
                client: mockClient,
            });

            expect(result).toEqual({ success: true });
            expect(createDocument).toHaveBeenCalledTimes(2);
            expect(createDocument).toHaveBeenCalledWith(
                "season_rosters",
                "unique()",
                expect.objectContaining({
                    playerId: "player-1",
                    teamId,
                    seasonId,
                }),
                expect.any(Array),
                "admin-client-mock",
            );
        });

        it("should ignore already exists errors (409) gracefully", async () => {
            const error = new Error("Document already exists");
            error.code = 409;
            createDocument.mockRejectedValue(error);

            const result = await addPlayersToSeasonRoster({
                playerIds: ["player-1"],
                teamId,
                seasonId,
                client: mockClient,
            });

            expect(result).toEqual({ success: true });
            expect(createDocument).toHaveBeenCalledTimes(1);
        });

        it("should throw other errors", async () => {
            const error = new Error("Database full");
            createDocument.mockRejectedValue(error);

            await expect(
                addPlayersToSeasonRoster({
                    playerIds: ["player-1"],
                    teamId,
                    seasonId,
                    client: mockClient,
                }),
            ).rejects.toThrow("Database full");
        });
    });

    describe("updateSeasonRoster", () => {
        it("should add missing players and delete removed players", async () => {
            // Mock current roster in database has player-1 and player-2
            listDocuments.mockResolvedValue({
                rows: [
                    { $id: "season-456_player-1", playerId: "player-1" },
                    { $id: "season-456_player-2", playerId: "player-2" },
                ],
            });
            createDocument.mockResolvedValue({});
            deleteDocument.mockResolvedValue({});

            // Target roster has player-2 and player-3 (add player-3, remove player-1)
            const result = await updateSeasonRoster({
                playerIds: ["player-2", "player-3"],
                teamId,
                seasonId,
                client: mockClient,
            });

            expect(result.success).toBe(true);
            // Verify fetch current roster
            expect(listDocuments).toHaveBeenCalledTimes(1);
            // Verify addition of player-3
            expect(createDocument).toHaveBeenCalledTimes(1);
            expect(createDocument).toHaveBeenCalledWith(
                "season_rosters",
                "unique()",
                expect.objectContaining({ playerId: "player-3" }),
                expect.any(Array),
                "admin-client-mock",
            );
            // Verify removal of player-1
            expect(deleteDocument).toHaveBeenCalledTimes(1);
            expect(deleteDocument).toHaveBeenCalledWith(
                "season_rosters",
                "season-456_player-1",
                mockClient,
            );
        });

        it("should normalize, filter, and deduplicate playerIds inputs", async () => {
            listDocuments.mockResolvedValue({
                rows: [{ $id: "season-456_player-1", playerId: "player-1" }],
            });
            createDocument.mockResolvedValue({});
            deleteDocument.mockResolvedValue({});

            // Target roster has duplicate "player-2", empty string, and nulls
            const result = await updateSeasonRoster({
                playerIds: ["player-1", "player-2", "player-2", "", null, 123],
                teamId,
                seasonId,
                client: mockClient,
            });

            expect(result.success).toBe(true);
            // Verify addition of only one player-2 (no duplicate addition, no empty/invalid additions)
            expect(createDocument).toHaveBeenCalledTimes(1);
            expect(createDocument).toHaveBeenCalledWith(
                "season_rosters",
                "unique()",
                expect.objectContaining({ playerId: "player-2" }),
                expect.any(Array),
                "admin-client-mock",
            );
            expect(deleteDocument).not.toHaveBeenCalled();
        });
    });

    describe("getSeasonRoster", () => {
        it("should list documents with correct filter query", async () => {
            listDocuments.mockResolvedValue({
                rows: [{ $id: "doc-1", playerId: "player-1" }],
            });

            const result = await getSeasonRoster({
                seasonId,
                client: mockClient,
            });

            expect(result).toEqual([{ $id: "doc-1", playerId: "player-1" }]);
            expect(listDocuments).toHaveBeenCalledWith(
                "season_rosters",
                expect.arrayContaining([
                    "equal(seasonId,season-456)",
                    "limit(100)",
                ]),
                mockClient,
            );
        });

        it("should return empty array and catch database errors gracefully", async () => {
            listDocuments.mockRejectedValue(new Error("Connection lost"));

            const result = await getSeasonRoster({
                seasonId,
                client: mockClient,
            });

            expect(result).toEqual([]);
        });
    });
});
