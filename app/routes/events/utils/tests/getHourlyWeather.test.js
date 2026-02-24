import getHourlyWeather from "../getHourlyWeather";
import { DateTime } from "luxon";

// Mock dependencies
jest.mock("../getRainoutLikelihood", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        likelihood: 10,
        color: "lime",
        reason: "Test",
    })),
}));

jest.mock("../calculatePrecipitation", () => ({
    __esModule: true,
    default: jest.fn(() => ({ rain: 0.1, snow: 0 })),
}));

describe("getHourlyWeather utility", () => {
    const createHourlyForecast = (startTime, overrides = {}) => ({
        interval: { startTime },
        temperature: { degrees: 75 },
        feelsLikeTemperature: { degrees: 78 },
        precipitation: { probability: { percent: 10 } },
        weatherCondition: { type: "CLEAR", description: { text: "Clear" } },
        wind: { speed: { value: 5 } },
        uvIndex: 3,
        ...overrides,
    });

    describe("edge cases", () => {
        it("should return null for null weather input", () => {
            const result = getHourlyWeather(null, "2024-06-15T18:00:00Z");

            expect(result).toBeNull();
        });

        it("should return null for empty weather array", () => {
            const result = getHourlyWeather([], "2024-06-15T18:00:00Z");

            expect(result).toBeNull();
        });

        it("should return null for undefined weather input", () => {
            const result = getHourlyWeather(undefined, "2024-06-15T18:00:00Z");

            expect(result).toBeNull();
        });

        it("should return null for non-array weather input", () => {
            const result = getHourlyWeather(
                "not-an-array",
                "2024-06-15T18:00:00Z",
            );

            expect(result).toBeNull();
        });
    });

    describe("date parsing", () => {
        it("should handle ISO string date format", () => {
            const weather = [createHourlyForecast("2024-06-15T18:00:00Z")];

            const result = getHourlyWeather(weather, "2024-06-15T18:00:00Z");

            expect(result).not.toBeNull();
            expect(result.hourly).toBeDefined();
        });

        it("should handle Date object", () => {
            const weather = [createHourlyForecast("2024-06-15T18:00:00Z")];
            const gameDate = new Date("2024-06-15T18:00:00Z");

            const result = getHourlyWeather(weather, gameDate);

            expect(result).not.toBeNull();
        });

        it("should handle millisecond timestamp", () => {
            const weather = [createHourlyForecast("2024-06-15T18:00:00Z")];
            const gameDate = new Date("2024-06-15T18:00:00Z").getTime();

            const result = getHourlyWeather(weather, gameDate);

            expect(result).not.toBeNull();
        });

        it("should handle Luxon DateTime object", () => {
            const weather = [createHourlyForecast("2024-06-15T18:00:00Z")];
            const gameDate = DateTime.fromISO("2024-06-15T18:00:00Z");

            const result = getHourlyWeather(weather, gameDate);

            expect(result).not.toBeNull();
        });
    });

    describe("hour selection", () => {
        it("should select the hour closest to and before game time", () => {
            const weather = [
                createHourlyForecast("2024-06-15T16:00:00Z", {
                    temperature: { degrees: 70 },
                }),
                createHourlyForecast("2024-06-15T17:00:00Z", {
                    temperature: { degrees: 75 },
                }),
                createHourlyForecast("2024-06-15T18:00:00Z", {
                    temperature: { degrees: 80 },
                }),
                createHourlyForecast("2024-06-15T19:00:00Z", {
                    temperature: { degrees: 78 },
                }),
            ];

            const result = getHourlyWeather(weather, "2024-06-15T18:30:00Z");

            expect(result.hourly.temperature.degrees).toBe(80); // 18:00 hour
        });

        it("should select exact hour when game time matches", () => {
            const weather = [
                createHourlyForecast("2024-06-15T17:00:00Z", {
                    temperature: { degrees: 70 },
                }),
                createHourlyForecast("2024-06-15T18:00:00Z", {
                    temperature: { degrees: 80 },
                }),
            ];

            const result = getHourlyWeather(weather, "2024-06-15T18:00:00Z");

            expect(result.hourly.temperature.degrees).toBe(80);
        });

        it("should fall back to closest future hour if no past hours exist", () => {
            const weather = [
                createHourlyForecast("2024-06-15T19:00:00Z", {
                    temperature: { degrees: 75 },
                }),
                createHourlyForecast("2024-06-15T20:00:00Z", {
                    temperature: { degrees: 72 },
                }),
            ];

            const result = getHourlyWeather(weather, "2024-06-15T18:00:00Z");

            expect(result.hourly.temperature.degrees).toBe(75); // Closest future hour
        });
    });

    describe("returned data structure", () => {
        it("should return hourly, rainout, and totalPrecipitation", () => {
            const weather = [createHourlyForecast("2024-06-15T18:00:00Z")];

            const result = getHourlyWeather(weather, "2024-06-15T18:00:00Z");

            expect(result).toHaveProperty("hourly");
            expect(result).toHaveProperty("rainout");
            expect(result).toHaveProperty("totalPrecipitation");
        });

        it("should include expected hourly weather properties", () => {
            const weather = [createHourlyForecast("2024-06-15T18:00:00Z")];

            const result = getHourlyWeather(weather, "2024-06-15T18:00:00Z");

            expect(result.hourly).toHaveProperty("temperature");
            expect(result.hourly).toHaveProperty("feelsLikeTemperature");
            expect(result.hourly).toHaveProperty("precipitation");
            expect(result.hourly).toHaveProperty("weatherCondition");
            expect(result.hourly).toHaveProperty("wind");
            expect(result.hourly).toHaveProperty("uvIndex");
        });
    });

    describe("fallback behavior for invalid dates", () => {
        it("should use last hour as fallback for invalid game date", () => {
            const weather = [
                createHourlyForecast("2024-06-15T17:00:00Z", {
                    temperature: { degrees: 70 },
                }),
                createHourlyForecast("2024-06-15T18:00:00Z", {
                    temperature: { degrees: 80 },
                }),
            ];

            const result = getHourlyWeather(weather, "invalid-date");

            // Should fall back to last hour in array
            expect(result).not.toBeNull();
            expect(result.hourly.temperature.degrees).toBe(80);
        });
    });
});
