import { DateTime } from "luxon";
import { getWeatherData } from "../weather";
import { readDocument } from "@/utils/databases";

jest.mock("@/utils/databases", () => ({
    readDocument: jest.fn(),
}));

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

    it("should return null if diffDays is greater than 5 or less than -1", async () => {
        const futureGameDate = DateTime.utc().plus({ days: 6 }).toISO();
        const pastGameDate = DateTime.utc().minus({ days: 2 }).toISO();

        let result = await getWeatherData(
            mockParkId,
            { gameDate: futureGameDate },
            mockClient,
        );
        expect(result).toBeNull();

        result = await getWeatherData(
            mockParkId,
            { gameDate: pastGameDate },
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

    it("should fetch history if game is in the past", async () => {
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

        expect(global.fetch).toHaveBeenCalled();
        expect(result).toHaveProperty("hourly");
        expect(result.hourly.length).toBeGreaterThan(0);
    });
});
