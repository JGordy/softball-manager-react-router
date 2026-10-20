import { getTeamGuestPlayers } from "../guests";

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((k, v) => ({ key: k, value: v })),
        limit: jest.fn((v) => ({ limit: v })),
    },
}));

const mockCreateAdminClient = jest.fn();
jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: () => mockCreateAdminClient(),
}));

const mockReadDocument = jest.fn();
const mockListDocuments = jest.fn().mockResolvedValue({ rows: [] });

jest.mock("@/utils/databases", () => ({
    readDocument: (...args) => mockReadDocument(...args),
    listDocuments: (...args) => mockListDocuments(...args),
}));

describe("getTeamGuestPlayers Loader", () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = {};
        mockCreateAdminClient.mockReturnValue(mockClient);
    });

    it("returns empty array when teamId is not provided", async () => {
        const result = await getTeamGuestPlayers({ teamId: "" });
        expect(result).toEqual([]);
    });

    it("returns guest players found via users table and game charts", async () => {
        // Mock listDocuments
        mockListDocuments.mockImplementation((collection, queries) => {
            if (collection === "users") {
                return Promise.resolve({
                    rows: [
                        {
                            $id: "guest-1",
                            userId: "guest-1",
                            firstName: "Guest",
                            lastName: "One",
                            gender: "Female",
                            isTemporary: true,
                        },
                    ],
                });
            }
            if (collection === "seasons") {
                return Promise.resolve({
                    rows: [{ $id: "season-1" }],
                });
            }
            if (collection === "games") {
                return Promise.resolve({
                    rows: [
                        {
                            $id: "game-1",
                            gameDate: "2026-05-10",
                            opponent: "Tigers",
                            playerChart: JSON.stringify([
                                {
                                    $id: "guest-1",
                                    firstName: "Guest",
                                    lastName: "One",
                                },
                                {
                                    $id: "guest-2",
                                    firstName: "Guest",
                                    lastName: "Two",
                                },
                            ]),
                        },
                    ],
                });
            }
            return Promise.resolve({ rows: [] });
        });

        // Mock readDocument for guest-2 lookup
        mockReadDocument.mockImplementation((collection, id) => {
            if (collection === "users" && id === "guest-2") {
                return Promise.resolve({
                    $id: "guest-2",
                    userId: "guest-2",
                    firstName: "Guest",
                    lastName: "Two",
                    gender: "Male",
                    isTemporary: true,
                });
            }
            return Promise.reject(new Error("Not found"));
        });

        const teamLogs = [
            { playerId: "guest-1", eventType: "single" },
            { playerId: "guest-1", eventType: "out" },
        ];

        const result = await getTeamGuestPlayers({
            teamId: "team-1",
            client: mockClient,
            teamLogs,
        });

        expect(result).toHaveLength(2);

        const guest1 = result.find((g) => g.$id === "guest-1");
        expect(guest1).toBeDefined();
        expect(guest1.gameCount).toBe(1);
        expect(guest1.recentGame).toEqual({
            gameId: "game-1",
            date: "2026-05-10",
            opponent: "Tigers",
        });
        expect(guest1.stats.ab).toBe(2);
        expect(guest1.stats.hits).toBe(1);
        expect(guest1.stats.avg).toBe(".500");

        const guest2 = result.find((g) => g.$id === "guest-2");
        expect(guest2).toBeDefined();
        expect(guest2.firstName).toBe("Guest");
        expect(guest2.lastName).toBe("Two");
    });

    it("sorts guest players with the most recent game on top", async () => {
        mockListDocuments.mockImplementation((collection) => {
            if (collection === "users") {
                return Promise.resolve({
                    rows: [
                        {
                            $id: "guest-older",
                            userId: "guest-older",
                            firstName: "Older",
                            lastName: "Guest",
                            isTemporary: true,
                        },
                        {
                            $id: "guest-newer",
                            userId: "guest-newer",
                            firstName: "Newer",
                            lastName: "Guest",
                            isTemporary: true,
                        },
                    ],
                });
            }
            if (collection === "seasons") {
                return Promise.resolve({ rows: [{ $id: "season-1" }] });
            }
            if (collection === "games") {
                return Promise.resolve({
                    rows: [
                        {
                            $id: "game-newer",
                            gameDate: "2026-06-20",
                            opponent: "Hawks",
                            playerChart: JSON.stringify([
                                { $id: "guest-newer", firstName: "Newer" },
                            ]),
                        },
                        {
                            $id: "game-older",
                            gameDate: "2026-05-01",
                            opponent: "Eagles",
                            playerChart: JSON.stringify([
                                { $id: "guest-older", firstName: "Older" },
                            ]),
                        },
                    ],
                });
            }
            return Promise.resolve({ rows: [] });
        });

        const result = await getTeamGuestPlayers({
            teamId: "team-1",
            client: mockClient,
        });

        expect(result).toHaveLength(2);
        expect(result[0].$id).toBe("guest-newer");
        expect(result[1].$id).toBe("guest-older");
    });
});
