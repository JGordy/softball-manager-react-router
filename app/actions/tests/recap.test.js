import {
    generateGameRecapBackground,
    formatRecapWeatherSummary,
} from "../recap";
import { readDocument, listDocuments, updateDocument } from "@/utils/databases";
import { createModel, generateContent } from "@/utils/ai";
import { Query } from "node-appwrite";
import { getWeatherData } from "@/utils/weather";

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

jest.mock("@/utils/weather", () => ({
    getWeatherData: jest.fn(),
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
            parkId: "park789",
        };
        readDocument.mockResolvedValueOnce(mockGame); // Game fetch

        // Mock team name fetch
        const mockTeam = {
            $id: "team456",
            name: "Viper Elite",
        };
        readDocument.mockResolvedValueOnce(mockTeam); // Team fetch

        // Mock park fetch
        const mockPark = {
            $id: "park789",
            city: "Atlanta",
            state: "GA",
            formattedAddress: "123 Softball Field, Atlanta, GA",
        };
        readDocument.mockResolvedValueOnce(mockPark); // Park fetch

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

        // Mock weather data
        getWeatherData.mockResolvedValueOnce({
            hourly: [
                {
                    interval: { startTime: "2026-05-22T14:00:00Z" },
                    temperature: { degrees: 85 },
                    weatherCondition: { description: { text: "Sunny" } },
                },
            ],
        });

        // Mock AI model configuration and content generation
        const mockModel = { modelName: "gemini-3.8-flash", thinking: "low" };
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
        expect(readDocument).toHaveBeenNthCalledWith(
            3,
            "parks",
            "park789",
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

        expect(createModel).toHaveBeenCalledWith({ thinking: "medium" });

        // Verify prompt text has play info, score details, weather, and guidelines
        const promptText = generateContent.mock.calls[0][1];
        expect(promptText).toContain("Viper Elite");
        expect(promptText).toContain("Mud Dogs");
        expect(promptText).toContain(
            "Final Score: Viper Elite 12 - 4 Mud Dogs",
        );
        expect(promptText).toContain(
            "Location: 123 Softball Field, Atlanta, GA",
        );
        expect(promptText).toContain("Weather: Sunny, 85°F");
        expect(promptText).toContain("Weather & Atmosphere");
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

    it("should fall back to season parkId and fetch weather when game.parkId is missing", async () => {
        const mockGame = {
            $id: "game123",
            teamId: "team456",
            seasonId: "season456",
            opponent: "Grant Park - United",
            score: "3",
            opponentScore: "25",
            result: "lost",
            gameDate: "2026-10-04T22:30:00Z",
            parkId: null,
            location: null,
        };
        readDocument.mockResolvedValueOnce(mockGame); // Game fetch

        const mockTeam = {
            $id: "team456",
            name: "Ormewood Park Sliders",
        };
        readDocument.mockResolvedValueOnce(mockTeam); // Team fetch

        const mockSeason = {
            $id: "season456",
            parkId: "parkSeason789",
            location: "Grant Park Field 1",
        };
        readDocument.mockResolvedValueOnce(mockSeason); // Season fetch

        const mockPark = {
            $id: "parkSeason789",
            formattedAddress: "840 Cherokee Ave SE, Atlanta, GA",
        };
        readDocument.mockResolvedValueOnce(mockPark); // Park fetch

        listDocuments.mockResolvedValueOnce({
            rows: [
                {
                    inning: 1,
                    halfInning: "top",
                    description: "Grant Park scores",
                    $createdAt: "2026-10-04T22:45:00Z",
                },
            ],
        }); // Logs fetch

        getWeatherData.mockResolvedValueOnce({
            hourly: [
                {
                    interval: { startTime: "2026-10-04T22:00:00Z" },
                    temperature: { degrees: 68 },
                    precipitation: { qpf: { quantity: 0.25 } },
                    weatherCondition: {
                        type: "RAIN",
                        description: { text: "Rain" },
                    },
                },
                {
                    interval: { startTime: "2026-10-04T23:00:00Z" },
                    temperature: { degrees: 66 },
                    precipitation: { qpf: { quantity: 0.15 } },
                    weatherCondition: {
                        type: "RAIN",
                        description: { text: "Rain" },
                    },
                },
            ],
        });

        createModel.mockReturnValueOnce({ modelName: "gemini-3.8-flash" });
        generateContent.mockResolvedValueOnce("Rainy battle at Grant Park");

        await generateGameRecapBackground({
            eventId: "game123",
            client: mockClient,
        });

        expect(readDocument).toHaveBeenCalledWith(
            "seasons",
            "season456",
            [],
            mockClient,
        );
        expect(readDocument).toHaveBeenCalledWith(
            "parks",
            "parkSeason789",
            [],
            mockClient,
        );
        expect(getWeatherData).toHaveBeenCalledWith(
            "parkSeason789",
            mockGame,
            mockClient,
        );

        const promptText = generateContent.mock.calls[0][1];
        expect(promptText).toContain("840 Cherokee Ave SE, Atlanta, GA");
        expect(promptText).toContain("Rain");
        expect(promptText).toContain("68°F");
        expect(promptText).toContain("0.25 in precip over 2 hrs");
        expect(promptText).toContain("Sloppy and muddy field conditions.");
    });

    describe("formatRecapWeatherSummary", () => {
        it("should return fallback when weatherData is missing or empty", () => {
            expect(formatRecapWeatherSummary({})).toBe(
                "Unknown / Not recorded",
            );
            expect(
                formatRecapWeatherSummary({ weatherData: { hourly: [] } }),
            ).toBe("Unknown / Not recorded");
        });

        it("should format clear weather compactly", () => {
            const weatherData = {
                hourly: [
                    {
                        interval: { startTime: "2026-05-22T14:00:00Z" },
                        temperature: { degrees: 75.2 },
                        weatherCondition: {
                            description: { text: "Sunny" },
                            type: "CLEAR",
                        },
                        wind: {
                            speed: { value: 6.2 },
                            direction: { cardinal: "SW" },
                        },
                    },
                ],
            };
            const result = formatRecapWeatherSummary({
                weatherData,
                gameEndTime: "2026-05-22T14:00:00Z",
            });
            expect(result).toBe("Sunny, 75°F, Wind 6 mph SW");
        });

        it("should format rainy weather with cumulative 2-hour precipitation and wet field note", () => {
            const weatherData = {
                hourly: [
                    {
                        interval: { startTime: "2026-05-22T13:00:00Z" },
                        temperature: { degrees: 64 },
                        feelsLikeTemperature: { degrees: 61 },
                        weatherCondition: {
                            description: { text: "Light Rain" },
                            type: "RAIN",
                        },
                        precipitation: {
                            qpf: { quantity: 0.15 },
                            probability: { percent: 70 },
                        },
                        wind: {
                            speed: { value: 10 },
                            direction: { cardinal: "NW" },
                        },
                    },
                    {
                        interval: { startTime: "2026-05-22T14:00:00Z" },
                        temperature: { degrees: 62 },
                        feelsLikeTemperature: { degrees: 59 },
                        weatherCondition: {
                            description: { text: "Heavy Rain" },
                            type: "RAIN",
                        },
                        precipitation: {
                            qpf: { quantity: 0.25 },
                            probability: { percent: 90 },
                        },
                        wind: {
                            speed: { value: 12 },
                            direction: { cardinal: "NW" },
                        },
                    },
                ],
            };

            const result = formatRecapWeatherSummary({
                weatherData,
                gameEndTime: "2026-05-22T14:00:00Z",
            });

            expect(result).toContain("Heavy Rain");
            expect(result).toContain("0.4 in precip over 2 hrs");
            expect(result).toContain("90% chance");
            expect(result).toContain("feels like 59°F");
            expect(result).toContain("Wind 12 mph NW");
            expect(result).toContain("Sloppy and muddy field conditions.");
        });

        it("should prioritize rain condition if it rained in the 2-hour window even if the final hour cleared", () => {
            const weatherData = {
                hourly: [
                    {
                        interval: { startTime: "2026-05-22T13:00:00Z" },
                        temperature: { degrees: 65 },
                        weatherCondition: {
                            description: { text: "Showers" },
                            type: "RAIN",
                        },
                        precipitation: {
                            qpf: { quantity: 0.1 },
                            probability: { percent: 60 },
                        },
                    },
                    {
                        interval: { startTime: "2026-05-22T14:00:00Z" },
                        temperature: { degrees: 66 },
                        weatherCondition: {
                            description: { text: "Cloudy" },
                            type: "CLOUDY",
                        },
                        precipitation: {
                            qpf: { quantity: 0 },
                            probability: { percent: 20 },
                        },
                    },
                ],
            };

            const result = formatRecapWeatherSummary({
                weatherData,
                gameEndTime: "2026-05-22T14:00:00Z",
            });

            expect(result).toContain("Showers");
            expect(result).toContain("0.1 in precip over 2 hrs");
            expect(result).toContain("Wet field conditions.");
        });
    });
});
