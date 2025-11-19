import { getEventById, getEventWithPlayerCharts } from "./games";
import { listDocuments, readDocument } from "@/utils/databases";
import { Query } from "node-appwrite";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(
            (field, value) =>
                `Query.equal("${field}", ${JSON.stringify(value)})`,
        ),
        limit: jest.fn((value) => `Query.limit(${value})`),
    },
}));

// Mock global fetch for weather API
global.fetch = jest.fn();

describe("Games Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});

        // Default mock for fetch to prevent errors
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("getEventById", () => {
        it("should return gameDeleted: true if game is not found", async () => {
            readDocument.mockRejectedValue({ code: 404 });

            const result = await getEventById({ eventId: "missing" });

            expect(result.gameDeleted).toBe(true);
            expect(result.game).toBeNull();
        });

        it("should return game data and deferred promises on success", async () => {
            const mockGame = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(JSON.stringify({ lineup: [] })),
                seasons: {
                    $id: "season1",
                    teams: [{ $id: "team1" }],
                    parkId: "park1",
                },
            };
            const mockUserIds = [{ userId: "user1", role: "manager" }];

            // Mock for loadGameBase
            readDocument.mockResolvedValueOnce(mockGame);
            listDocuments.mockResolvedValue({ documents: mockUserIds });

            // Mock for getWeatherData
            readDocument.mockResolvedValue({ latitude: 0, longitude: 0 });

            const result = await getEventById({ eventId: "game1" });

            expect(result.gameDeleted).toBe(false);
            expect(result.game.$id).toBe("game1");
            expect(result.managerIds).toContain("user1");
            expect(result.deferredData).toBeDefined();
            expect(result.deferredData.players).toBeInstanceOf(Promise);
            expect(result.deferredData.park).toBeInstanceOf(Promise);
        });
    });

    describe("getEventWithPlayerCharts", () => {
        it("should return game data with resolved players", async () => {
            const mockGame = {
                $id: "game1",
                gameDate: "2023-10-27T10:00:00Z",
                playerChart: JSON.stringify(JSON.stringify({ lineup: [] })),
                seasons: {
                    $id: "season1",
                    teams: [{ $id: "team1" }],
                    parkId: "park1",
                },
            };
            const mockUserIds = [{ userId: "user1", role: "player" }];
            const mockUsers = [{ $id: "user1", name: "Player 1" }];
            const mockAttendance = [{ $id: "att1" }];

            // Mock for loadGameBase
            readDocument.mockResolvedValueOnce(mockGame);

            // Mock all listDocuments calls in order
            listDocuments
                .mockResolvedValueOnce({ documents: mockUserIds }) // memberships
                .mockResolvedValueOnce({ documents: mockUsers }) // users in resolvePlayers
                .mockResolvedValueOnce({ documents: mockAttendance }); // attendance

            const result = await getEventWithPlayerCharts({
                request: {},
                eventId: "game1",
            });

            expect(result.game).toBeDefined();
            expect(result.players).toHaveLength(1);
            expect(result.players[0].name).toBe("Player 1");
            expect(result.attendance).toHaveLength(1);
        });
    });
});
