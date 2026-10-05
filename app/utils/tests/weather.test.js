import { DateTime } from "luxon";
import {
    getWeatherData,
    fetchOpenMeteoArchive,
    degreesToCardinal,
    mapWmoCodeToCondition,
} from "../weather";
import { readDocument } from "@/utils/databases";

jest.mock("@/utils/databases", () => ({
    readDocument: jest.fn(),
}));

describe("degreesToCardinal", () => {
    it("should convert wind direction degrees to cardinal directions", () => {
        expect(degreesToCardinal(0)).toBe("N");
        expect(degreesToCardinal(45)).toBe("NE");
        expect(degreesToCardinal(90)).toBe("E");
        expect(degreesToCardinal(135)).toBe("SE");
        expect(degreesToCardinal(180)).toBe("S");
        expect(degreesToCardinal(225)).toBe("SW");
        expect(degreesToCardinal(270)).toBe("W");
        expect(degreesToCardinal(315)).toBe("NW");
        expect(degreesToCardinal(360)).toBe("N");
    });

    it("should return N for null, undefined, or NaN", () => {
        expect(degreesToCardinal(null)).toBe("N");
        expect(degreesToCardinal(undefined)).toBe("N");
        expect(degreesToCardinal(NaN)).toBe("N");
    });
});

describe("mapWmoCodeToCondition", () => {
    it("should map clear, cloudy, and fog codes", () => {
        expect(mapWmoCodeToCondition(0)).toEqual({
            type: "CLEAR",
            description: { text: "Clear" },
        });
        expect(mapWmoCodeToCondition(1)).toEqual({
            type: "CLEAR",
            description: { text: "Mainly Clear" },
        });
        expect(mapWmoCodeToCondition(2)).toEqual({
            type: "CLOUDY",
            description: { text: "Partly Cloudy" },
        });
        expect(mapWmoCodeToCondition(3)).toEqual({
            type: "CLOUDY",
            description: { text: "Overcast" },
        });
        expect(mapWmoCodeToCondition(45)).toEqual({
            type: "FOG",
            description: { text: "Fog" },
        });
    });

    it("should map rain, drizzle, snow, and thunderstorm codes", () => {
        expect(mapWmoCodeToCondition(51)).toEqual({
            type: "DRIZZLE",
            description: { text: "Light Drizzle" },
        });
        expect(mapWmoCodeToCondition(63)).toEqual({
            type: "RAIN",
            description: { text: "Rain" },
        });
        expect(mapWmoCodeToCondition(71)).toEqual({
            type: "SNOW",
            description: { text: "Snow" },
        });
        expect(mapWmoCodeToCondition(81)).toEqual({
            type: "RAIN",
            description: { text: "Rain Showers" },
        });
        expect(mapWmoCodeToCondition(95)).toEqual({
            type: "THUNDERSTORM",
            description: { text: "Thunderstorm" },
        });
        expect(mapWmoCodeToCondition(99)).toEqual({
            type: "THUNDERSTORM",
            description: { text: "Thunderstorm with Hail" },
        });
    });

    it("should return default Clear for unknown codes", () => {
        expect(mapWmoCodeToCondition(999)).toEqual({
            type: "CLEAR",
            description: { text: "Clear" },
        });
    });
});

describe("fetchOpenMeteoArchive", () => {
    const mockPark = {
        latitude: 33.749,
        longitude: -84.388,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    it("should return empty array if park has missing coordinates", async () => {
        const gameTime = DateTime.utc();
        const sixHoursBefore = gameTime.minus({ hours: 6 });

        expect(
            await fetchOpenMeteoArchive(null, gameTime, sixHoursBefore),
        ).toEqual([]);
        expect(
            await fetchOpenMeteoArchive({}, gameTime, sixHoursBefore),
        ).toEqual([]);
        expect(
            await fetchOpenMeteoArchive(
                { latitude: 33.749 },
                gameTime,
                sixHoursBefore,
            ),
        ).toEqual([]);
    });

    it("should return empty array when fetch returns non-OK status", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const gameTime = DateTime.utc().minus({ days: 2 });
        const sixHoursBefore = gameTime.minus({ hours: 6 });

        const result = await fetchOpenMeteoArchive(
            mockPark,
            gameTime,
            sixHoursBefore,
        );
        expect(result).toEqual([]);
    });

    it("should format Open-Meteo hourly response to Google Weather schema", async () => {
        const gameTime = DateTime.utc().minus({ days: 2 });
        const sixHoursBefore = gameTime.minus({ hours: 6 });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                hourly: {
                    time: ["2026-10-03T18:00", "2026-10-03T19:00"],
                    temperature_2m: [72.4, 70.8],
                    apparent_temperature: [74.1, 71.9],
                    precipitation: [0.15, 0.25],
                    weather_code: [63, 81],
                    wind_speed_10m: [8.2, 10.4],
                    wind_direction_10m: [90, 180],
                },
            }),
        });

        const result = await fetchOpenMeteoArchive(
            mockPark,
            gameTime,
            sixHoursBefore,
        );

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(
                "https://archive-api.open-meteo.com/v1/archive?latitude=33.749&longitude=-84.388",
            ),
        );
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            interval: { startTime: "2026-10-03T18:00:00.000Z" },
            temperature: { degrees: 72 },
            feelsLikeTemperature: { degrees: 74 },
            precipitation: { qpf: { quantity: 0.15 } },
            weatherCondition: {
                type: "RAIN",
                description: { text: "Rain" },
            },
            wind: {
                speed: { value: 8 },
                direction: { degrees: 90, cardinal: "E" },
            },
        });
    });
});

describe("getWeatherData", () => {
    const mockClient = { tablesDB: { id: "mock-client-db" } };
    const mockParkId = "park123";
    const mockPark = {
        $id: mockParkId,
        latitude: 33.749,
        longitude: -84.388,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should return null if diffDays is greater than 5 or less than -365", async () => {
        const futureGameDate = DateTime.utc().plus({ days: 6 }).toISO();
        const ancientGameDate = DateTime.utc().minus({ days: 400 }).toISO();

        let result = await getWeatherData(
            mockParkId,
            { gameDate: futureGameDate },
            mockClient,
        );
        expect(result).toBeNull();

        result = await getWeatherData(
            mockParkId,
            { gameDate: ancientGameDate },
            mockClient,
        );
        expect(result).toBeNull();
    });

    it("should return null if park is not found", async () => {
        readDocument.mockResolvedValueOnce(null);
        const gameDate = DateTime.utc().toISO();

        const result = await getWeatherData(
            mockParkId,
            { gameDate },
            mockClient,
        );

        expect(readDocument).toHaveBeenCalledWith(
            "parks",
            mockParkId,
            [],
            mockClient,
        );
        expect(result).toBeNull();
    });

    it("should fetch forecast if game is in the future", async () => {
        readDocument.mockResolvedValueOnce(mockPark);

        const gameDate = DateTime.utc().plus({ hours: 10 }).toISO();
        const sixHoursBefore = DateTime.fromISO(gameDate, { zone: "utc" })
            .minus({ hours: 6 })
            .toISO();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                forecastHours: [
                    {
                        interval: { startTime: sixHoursBefore },
                        temperature: { degrees: 85 },
                    },
                    {
                        interval: { startTime: gameDate },
                        temperature: { degrees: 86 },
                    },
                ],
            }),
        });

        const result = await getWeatherData(
            mockParkId,
            { gameDate },
            mockClient,
        );

        expect(global.fetch).toHaveBeenCalled();
        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBeGreaterThan(0);
    });

    it("should fetch history if game is in the past within 24 hours", async () => {
        readDocument.mockResolvedValueOnce(mockPark);

        const gameDate = DateTime.utc().minus({ hours: 10 }).toISO();
        const sixHoursBefore = DateTime.fromISO(gameDate, { zone: "utc" })
            .minus({ hours: 6 })
            .toISO();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                historyHours: [
                    {
                        interval: { startTime: sixHoursBefore },
                        temperature: { degrees: 80 },
                    },
                    {
                        interval: { startTime: gameDate },
                        temperature: { degrees: 78 },
                    },
                ],
            }),
        });

        const result = await getWeatherData(
            mockParkId,
            { gameDate },
            mockClient,
        );

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringMatching(/hours=(12|13)/),
        );
        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBeGreaterThan(0);
    });

    it("should fetch from Open-Meteo Archive API if game is more than 1 day in the past", async () => {
        readDocument.mockResolvedValueOnce(mockPark);

        const gameDate = DateTime.utc().minus({ days: 2 }).toISO();
        const sixHoursBefore = DateTime.fromISO(gameDate, { zone: "utc" })
            .minus({ hours: 6 })
            .toISO();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                hourly: {
                    time: [sixHoursBefore, gameDate],
                    temperature_2m: [75, 73],
                    apparent_temperature: [77, 75],
                    precipitation: [0.1, 0.4],
                    weather_code: [63, 63],
                    wind_speed_10m: [5, 6],
                    wind_direction_10m: [90, 90],
                },
            }),
        });

        const result = await getWeatherData(
            mockParkId,
            { gameDate },
            mockClient,
        );

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(
                "https://archive-api.open-meteo.com/v1/archive",
            ),
        );
        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBeGreaterThan(0);
        expect(result.hourly[0].weatherCondition.type).toBe("RAIN");
    });

    it("should fall back to Open-Meteo if Google History returns empty array", async () => {
        readDocument.mockResolvedValueOnce(mockPark);

        const gameDate = DateTime.utc().minus({ hours: 10 }).toISO();
        const sixHoursBefore = DateTime.fromISO(gameDate, { zone: "utc" })
            .minus({ hours: 6 })
            .toISO();

        // First call to Google History returns empty array
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                historyHours: [],
            }),
        });

        // Second call falls back to Open-Meteo Archive
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                hourly: {
                    time: [sixHoursBefore, gameDate],
                    temperature_2m: [72, 70],
                    apparent_temperature: [74, 72],
                    precipitation: [0, 0.2],
                    weather_code: [61, 63],
                    wind_speed_10m: [4, 5],
                    wind_direction_10m: [180, 180],
                },
            }),
        });

        const result = await getWeatherData(
            mockParkId,
            { gameDate },
            mockClient,
        );

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith(
            expect.stringContaining(
                "https://archive-api.open-meteo.com/v1/archive",
            ),
        );
        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBeGreaterThan(0);
    });

    it("should gracefully use game.dateTime fallback if gameDate is missing", async () => {
        readDocument.mockResolvedValueOnce(mockPark);

        const dateTime = DateTime.utc().plus({ hours: 10 }).toISO();
        const sixHoursBefore = DateTime.fromISO(dateTime, { zone: "utc" })
            .minus({ hours: 6 })
            .toISO();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                forecastHours: [
                    {
                        interval: { startTime: sixHoursBefore },
                        temperature: { degrees: 77 },
                    },
                    {
                        interval: { startTime: dateTime },
                        temperature: { degrees: 79 },
                    },
                ],
            }),
        });

        const result = await getWeatherData(
            mockParkId,
            { dateTime },
            mockClient,
        );

        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBeGreaterThan(0);
    });

    it("should include weather during the game duration (up to 3 hours after start)", async () => {
        readDocument.mockResolvedValueOnce(mockPark);

        const gameDate = DateTime.utc().minus({ hours: 4 }).toISO();
        const duringGame = DateTime.fromISO(gameDate, { zone: "utc" })
            .plus({ hours: 1.5 })
            .toISO();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                historyHours: [
                    {
                        interval: { startTime: gameDate },
                        temperature: { degrees: 72 },
                        precipitation: { qpf: { quantity: 0.2 } },
                    },
                    {
                        interval: { startTime: duringGame },
                        temperature: { degrees: 70 },
                        precipitation: { qpf: { quantity: 0.3 } },
                    },
                ],
            }),
        });

        const result = await getWeatherData(
            mockParkId,
            { gameDate },
            mockClient,
        );

        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBe(2);
    });
});
