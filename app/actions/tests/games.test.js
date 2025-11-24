import {
    createSingleGame,
    createGames,
    updateGame,
    deleteGame,
} from "../games";
import {
    createDocument,
    updateDocument,
    deleteDocument,
} from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("@/utils/dateTime", () => ({
    combineDateTime: jest.fn((date, time) => `${date}T${time}`),
}));

jest.mock("react-router", () => ({
    redirect: jest.fn((path) => ({ redirect: path })),
}));

describe("Games Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        hasBadWords.mockResolvedValue(false);
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("createSingleGame", () => {
        it("should create a game successfully", async () => {
            const mockValues = {
                gameDate: "2024-01-01",
                gameTime: "10:00",
                isHomeGame: "true",
                opponent: "Team A",
                seasonId: "season1",
                timeZone: "America/New_York",
            };

            createDocument.mockResolvedValue({ $id: "game1" });

            const result = await createSingleGame({ values: mockValues });

            expect(createDocument).toHaveBeenCalledWith("games", "unique-id", {
                isHomeGame: true,
                gameDate: "2024-01-01T10:00",
                opponent: "Team A",
                seasons: "season1",
                seasonId: "season1",
                timeZone: "America/New_York",
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should reject games with bad words in opponent name", async () => {
            hasBadWords.mockResolvedValue(true);

            const mockValues = {
                opponent: "BadWord Team",
                gameDate: "2024-01-01",
                gameTime: "10:00",
            };

            const result = await createSingleGame({ values: mockValues });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(createDocument).not.toHaveBeenCalled();
        });
    });

    describe("createGames", () => {
        it("should create multiple games", async () => {
            const mockValues = {
                games: JSON.stringify([
                    { opponent: "Team A", gameDate: "2024-01-01" },
                    { opponent: "Team B", gameDate: "2024-01-02" },
                ]),
                timeZone: "America/New_York",
            };

            createDocument.mockResolvedValue({ $id: "game1" });

            const result = await createGames({ values: mockValues });

            expect(createDocument).toHaveBeenCalledTimes(2);
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.response.games).toHaveLength(2);
        });
    });

    describe("updateGame", () => {
        it("should update game successfully", async () => {
            const mockValues = {
                opponent: "Updated Team",
                score: "10",
                opponentScore: "5",
            };

            updateDocument.mockResolvedValue({ $id: "game1" });

            const result = await updateGame({
                values: mockValues,
                eventId: "game1",
            });

            expect(updateDocument).toHaveBeenCalledWith("games", "game1", {
                opponent: "Updated Team",
                score: "10",
                opponentScore: "5",
                result: "won",
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should compute result correctly", async () => {
            updateDocument.mockResolvedValue({ $id: "game1" });

            // Test win
            let result = await updateGame({
                values: { score: "10", opponentScore: "5" },
                eventId: "game1",
            });
            expect(result.response.gameDetails).toBeDefined();

            // Test loss
            result = await updateGame({
                values: { score: "5", opponentScore: "10" },
                eventId: "game1",
            });
            expect(result.response.gameDetails).toBeDefined();

            // Test tie
            result = await updateGame({
                values: { score: "5", opponentScore: "5" },
                eventId: "game1",
            });
            expect(result.response.gameDetails).toBeDefined();
        });

        it("should reject updates with bad words", async () => {
            hasBadWords.mockResolvedValue(true);

            const result = await updateGame({
                values: { opponent: "BadWord Team" },
                eventId: "game1",
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });
    });

    describe("deleteGame", () => {
        it("should delete game and redirect", async () => {
            deleteDocument.mockResolvedValue({});

            const result = await deleteGame({
                values: {},
                eventId: "game1",
            });

            expect(deleteDocument).toHaveBeenCalledWith("games", "game1");
            expect(result.redirect).toBe("/events");
        });
    });
});
