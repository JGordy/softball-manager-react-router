import calculatePrecipitation from "../calculatePrecipitation";

describe("calculatePrecipitation utility", () => {
    it("should calculate total rain and snow from hourly weather", () => {
        const hourlyWeather = [
            {
                precipitation: {
                    qpf: { quantity: 0.1 },
                    snowQpf: { quantity: 0 },
                },
            },
            {
                precipitation: {
                    qpf: { quantity: 0.2 },
                    snowQpf: { quantity: 0.05 },
                },
            },
            {
                precipitation: {
                    qpf: { quantity: 0.15 },
                    snowQpf: { quantity: 0.1 },
                },
            },
        ];

        const result = calculatePrecipitation(hourlyWeather);

        expect(result.rain).toBeCloseTo(0.45);
        expect(result.snow).toBeCloseTo(0.15);
    });

    it("should return zero for empty array", () => {
        const result = calculatePrecipitation([]);

        expect(result).toEqual({ rain: 0, snow: 0 });
    });

    it("should return zero for null input", () => {
        const result = calculatePrecipitation(null);

        expect(result).toEqual({ rain: 0, snow: 0 });
    });

    it("should return zero for undefined input", () => {
        const result = calculatePrecipitation(undefined);

        expect(result).toEqual({ rain: 0, snow: 0 });
    });

    it("should handle missing precipitation data", () => {
        const hourlyWeather = [
            { temperature: 70 }, // No precipitation field
            { precipitation: {} }, // Empty precipitation object
            { precipitation: { qpf: {} } }, // No quantity
        ];

        const result = calculatePrecipitation(hourlyWeather);

        expect(result).toEqual({ rain: 0, snow: 0 });
    });

    it("should handle only rain data", () => {
        const hourlyWeather = [
            { precipitation: { qpf: { quantity: 0.5 } } },
            { precipitation: { qpf: { quantity: 0.3 } } },
        ];

        const result = calculatePrecipitation(hourlyWeather);

        expect(result.rain).toBeCloseTo(0.8);
        expect(result.snow).toBe(0);
    });

    it("should handle only snow data", () => {
        const hourlyWeather = [
            { precipitation: { snowQpf: { quantity: 1.0 } } },
            { precipitation: { snowQpf: { quantity: 0.5 } } },
        ];

        const result = calculatePrecipitation(hourlyWeather);

        expect(result.rain).toBe(0);
        expect(result.snow).toBeCloseTo(1.5);
    });

    it("should handle mixed valid and invalid entries", () => {
        const hourlyWeather = [
            { precipitation: { qpf: { quantity: 0.2 } } },
            null,
            undefined,
            { precipitation: { qpf: { quantity: 0.3 } } },
        ].filter(Boolean); // Filter out null/undefined

        const result = calculatePrecipitation(hourlyWeather);

        expect(result.rain).toBeCloseTo(0.5);
    });
});
