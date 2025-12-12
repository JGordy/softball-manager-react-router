import getGameDateWeather from "../getGameDateWeather";

// Mock getHourlyWeather since it's tested separately
jest.mock("../getHourlyWeather", () => ({
    __esModule: true,
    default: jest.fn(),
}));

import getHourlyWeather from "../getHourlyWeather";

describe("getGameDateWeather utility", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return empty object when weather is null", () => {
        const result = getGameDateWeather("2024-06-15T18:00:00Z", null);

        expect(result).toEqual({});
        expect(getHourlyWeather).not.toHaveBeenCalled();
    });

    it("should return empty object when weather is undefined", () => {
        const result = getGameDateWeather("2024-06-15T18:00:00Z", undefined);

        expect(result).toEqual({});
    });

    it("should return empty object when weather.hourly is missing", () => {
        const result = getGameDateWeather("2024-06-15T18:00:00Z", {});

        expect(result).toEqual({});
    });

    it("should return empty object when getHourlyWeather returns null", () => {
        getHourlyWeather.mockReturnValue(null);

        const weather = { hourly: [{ temp: 75 }] };
        const result = getGameDateWeather("2024-06-15T18:00:00Z", weather);

        expect(result).toEqual({});
    });

    it("should call getHourlyWeather with correct parameters", () => {
        const mockHourlyResult = {
            hourly: { temperature: 75 },
            rainout: { likelihood: 10 },
            totalPrecipitation: { rain: 0.1, snow: 0 },
        };
        getHourlyWeather.mockReturnValue(mockHourlyResult);

        const weather = { hourly: [{ temp: 75 }] };
        const gameDate = "2024-06-15T18:00:00Z";

        getGameDateWeather(gameDate, weather);

        expect(getHourlyWeather).toHaveBeenCalledWith(weather.hourly, gameDate);
    });

    it("should return hourly, rainout, and totalPrecipitation from getHourlyWeather", () => {
        const mockHourlyResult = {
            hourly: { temperature: { degrees: 75 }, wind: { speed: 10 } },
            rainout: {
                likelihood: 25,
                color: "yellow",
                reason: "Chance of rain",
            },
            totalPrecipitation: { rain: 0.3, snow: 0 },
        };
        getHourlyWeather.mockReturnValue(mockHourlyResult);

        const weather = { hourly: [{ temp: 75 }] };
        const result = getGameDateWeather("2024-06-15T18:00:00Z", weather);

        expect(result).toEqual({
            hourly: mockHourlyResult.hourly,
            rainout: mockHourlyResult.rainout,
            totalPrecipitation: mockHourlyResult.totalPrecipitation,
        });
    });

    it("should handle weather object with empty hourly array", () => {
        getHourlyWeather.mockReturnValue(null);

        const weather = { hourly: [] };
        const result = getGameDateWeather("2024-06-15T18:00:00Z", weather);

        expect(result).toEqual({});
    });
});
