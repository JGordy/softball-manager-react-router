import { generateGameRecapBackground } from "../recap";
import { readDocument, listDocuments, updateDocument } from "@/utils/databases";
import { createModel, generateContent } from "@/utils/ai";
import { Query } from "node-appwrite";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    readDocument: jest.fn(),
    listDocuments: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/ai", () => ({
    createModel: jest.fn(),
    generateContent: jest.fn(),
}));

describe("generateGameRecapBackground Action", () => {
    const mockClient = { tablesDB: { id: "mock-client-db" } };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
        console.warn.mockRestore();
    });

    it("should throw error if eventId or client is missing", async () => {
        await expect(
            generateGameRecapBackground({ eventId: null, client: mockClient }),
        ).rejects.toThrow(
            "generateGameRecapBackground: eventId is strictly required",
        );

        await expect(
            generateGameRecapBackground({ eventId: "game123", client: null }),
        ).rejects.toThrow(
            "generateGameRecapBackground: client is strictly required",
        );
    });

    it("should throw error if game document is not found", async () => {
        readDocument.mockResolvedValueOnce(null); // Game read fails

        await expect(
            generateGameRecapBackground({
                eventId: "game123",
                client: mockClient,
            }),
        ).rejects.toThrow(
            "generateGameRecapBackground: Game game123 not found",
        );

        expect(readDocument).toHaveBeenCalledWith(
            "games",
            "game123",
            [],
            mockClient,
        );
    });

    it("should generate a rich game recap successfully and update game document", async () => {
        // Mock game data
        const mockGame = {
            $id: "game123",
            teamId: "team456",
            opponent: "Mud Dogs",
            score: "12",
            opponentScore: "4",
            result: "won",
            gameDate: "2026-05-22",
        };
        readDocument.mockResolvedValueOnce(mockGame); // Game fetch

        // Mock team name fetch
        const mockTeam = {
            $id: "team456",
            name: "Viper Elite",
        };
        readDocument.mockResolvedValueOnce(mockTeam); // Team fetch

        // Mock game logs
        const mockLogs = {
            rows: [
                {
                    inning: 1,
                    halfInning: "top",
                    description:
                        "John Doe hits a solo home run to center field",
                    eventType: "homerun",
                    rbi: 1,
                },
                {
                    inning: 2,
                    halfInning: "bottom",
                    description: "Opponent walks",
                    eventType: "walk",
                    rbi: 0,
                },
            ],
        };
        listDocuments.mockResolvedValueOnce(mockLogs); // Logs fetch

        // Mock AI model configuration and content generation
        const mockModel = { modelName: "gemini-3.5-flash", thinking: "medium" };
        createModel.mockReturnValueOnce(mockModel);
        generateContent.mockResolvedValueOnce(
            "# Victory at the Diamond\n\nWhat a spectacular victory for Viper Elite against Mud Dogs!",
        );

        // Run background action
        await generateGameRecapBackground({
            eventId: "game123",
            client: mockClient,
        });

        // Assertions
        expect(readDocument).toHaveBeenNthCalledWith(
            1,
            "games",
            "game123",
            [],
            mockClient,
        );
        expect(readDocument).toHaveBeenNthCalledWith(
            2,
            "teams",
            "team456",
            [],
            mockClient,
        );

        expect(listDocuments).toHaveBeenCalledWith(
            "game_logs",
            [
                Query.equal("gameId", "game123"),
                Query.orderAsc("$createdAt"),
                Query.limit(200),
            ],
            mockClient,
        );

        expect(createModel).toHaveBeenCalledWith();

        // Verify prompt text has play info and score details
        const promptText = generateContent.mock.calls[0][1];
        expect(promptText).toContain("Viper Elite");
        expect(promptText).toContain("Mud Dogs");
        expect(promptText).toContain(
            "Final Score: Viper Elite 12 - 4 Mud Dogs",
        );
        expect(promptText).toContain("John Doe hits a solo home run");

        // Verify update document
        expect(updateDocument).toHaveBeenCalledWith(
            "games",
            "game123",
            {
                recap: "# Victory at the Diamond\n\nWhat a spectacular victory for Viper Elite against Mud Dogs!",
            },
            mockClient,
        );
    });

    it("should exit early and do nothing if no logs are present", async () => {
        const mockGame = {
            $id: "game123",
            teamId: "team456",
            opponent: "Mud Dogs",
            score: "12",
            opponentScore: "4",
            result: "won",
        };
        readDocument.mockResolvedValueOnce(mockGame);
        listDocuments.mockResolvedValueOnce({ rows: [] }); // Empty logs array

        await generateGameRecapBackground({
            eventId: "game123",
            client: mockClient,
        });

        expect(createModel).not.toHaveBeenCalled();
        expect(generateContent).not.toHaveBeenCalled();
        expect(updateDocument).not.toHaveBeenCalled();
    });

    it("should gracefully fall back to generic team name if team fetch fails", async () => {
        const mockGame = {
            $id: "game123",
            teamId: "team456",
            opponent: "Mud Dogs",
            score: "12",
            opponentScore: "4",
            result: "won",
        };
        readDocument.mockResolvedValueOnce(mockGame);
        readDocument.mockRejectedValueOnce(new Error("Team database error")); // Team fetch fails

        listDocuments.mockResolvedValueOnce({
            rows: [{ inning: 1, halfInning: "top", description: "Base Hit" }],
        }); // Non-empty logs
        createModel.mockReturnValueOnce({});
        generateContent.mockResolvedValueOnce("Fall back recap");

        await generateGameRecapBackground({
            eventId: "game123",
            client: mockClient,
        });

        // Verify prompt text still contains basic fallback info
        const promptText = generateContent.mock.calls[0][1];
        expect(promptText).toContain("Our Team");
        expect(promptText).toContain("Mud Dogs");

        expect(updateDocument).toHaveBeenCalledWith(
            "games",
            "game123",
            { recap: "Fall back recap" },
            mockClient,
        );
    });
});
