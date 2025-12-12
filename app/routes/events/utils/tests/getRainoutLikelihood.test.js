import getRainoutLikelihood from "../getRainoutLikelihood";

// Mock calculatePrecipitation since it's tested separately
jest.mock("../calculatePrecipitation", () => ({
    __esModule: true,
    default: jest.fn(() => ({ rain: 0, snow: 0 })),
}));

import calculatePrecipitation from "../calculatePrecipitation";

describe("getRainoutLikelihood utility", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        calculatePrecipitation.mockReturnValue({ rain: 0, snow: 0 });
    });

    describe("edge cases", () => {
        it("should return 0 likelihood for null input", () => {
            const result = getRainoutLikelihood(null);

            expect(result.likelihood).toBe(0);
            expect(result.color).toBe("blue");
            expect(result.reason).toBe("No weather data available");
        });

        it("should return 0 likelihood for empty array", () => {
            const result = getRainoutLikelihood([]);

            expect(result.likelihood).toBe(0);
            expect(result.color).toBe("blue");
            expect(result.reason).toBe("No weather data available");
        });

        it("should return 0 likelihood for undefined input", () => {
            const result = getRainoutLikelihood(undefined);

            expect(result.likelihood).toBe(0);
            expect(result.color).toBe("blue");
            expect(result.reason).toBe("No weather data available");
        });
    });

    describe("color coding", () => {
        it('should return "blue" for likelihood <= 5', () => {
            const weather = [
                { precipitation: { probability: { percent: 5 } } },
            ];

            const result = getRainoutLikelihood(weather);

            expect(result.color).toBe("blue");
        });

        it('should return "green" for likelihood 6-15', () => {
            const weather = [
                { precipitation: { probability: { percent: 15 } } },
            ];

            const result = getRainoutLikelihood(weather);

            expect(result.color).toBe("green");
        });

        it('should return "yellow" for likelihood 16-30', () => {
            const weather = [
                { precipitation: { probability: { percent: 25 } } },
            ];

            const result = getRainoutLikelihood(weather);

            expect(result.color).toBe("yellow");
        });

        it('should return "orange" for likelihood 31-50', () => {
            const weather = [
                { precipitation: { probability: { percent: 45 } } },
            ];

            const result = getRainoutLikelihood(weather);

            expect(result.color).toBe("orange");
        });
    });

    describe("precipitation probability weighting", () => {
        it("should weight later hours more heavily", () => {
            // Hour 1: 50% chance, Hour 2: 0% chance
            const earlyRain = [
                { precipitation: { probability: { percent: 50 } } },
                { precipitation: { probability: { percent: 0 } } },
            ];

            // Hour 1: 0% chance, Hour 2: 50% chance
            const lateRain = [
                { precipitation: { probability: { percent: 0 } } },
                { precipitation: { probability: { percent: 50 } } },
            ];

            const earlyResult = getRainoutLikelihood(earlyRain);
            const lateResult = getRainoutLikelihood(lateRain);

            // Late rain should have higher likelihood due to quadratic weighting
            expect(lateResult.likelihood).toBeGreaterThan(
                earlyResult.likelihood,
            );
        });
    });

    describe("thunderstorm factor", () => {
        it("should increase likelihood when thunderstorm probability is high", () => {
            const noThunderstorm = [
                {
                    precipitation: { probability: { percent: 30 } },
                    thunderstormProbability: 0,
                },
            ];

            const withThunderstorm = [
                {
                    precipitation: { probability: { percent: 30 } },
                    thunderstormProbability: 50,
                },
            ];

            const noStormResult = getRainoutLikelihood(noThunderstorm);
            const stormResult = getRainoutLikelihood(withThunderstorm);

            expect(stormResult.likelihood).toBeGreaterThan(
                noStormResult.likelihood,
            );
        });
    });

    describe("field condition factor", () => {
        it("should increase likelihood when total rain accumulation is high", () => {
            const weather = [
                { precipitation: { probability: { percent: 30 } } },
            ];

            // Low rain accumulation
            calculatePrecipitation.mockReturnValueOnce({ rain: 0.05, snow: 0 });
            const lowRainResult = getRainoutLikelihood(weather);

            // High rain accumulation
            calculatePrecipitation.mockReturnValueOnce({ rain: 0.8, snow: 0 });
            const highRainResult = getRainoutLikelihood(weather);

            expect(highRainResult.likelihood).toBeGreaterThan(
                lowRainResult.likelihood,
            );
        });
    });

    describe("reason generation", () => {
        it('should return "Clear conditions expected" for low likelihood', () => {
            const weather = [
                { precipitation: { probability: { percent: 3 } } },
            ];

            const result = getRainoutLikelihood(weather);

            expect(result.reason).toBe("Clear conditions expected");
        });

        it("should mention thunderstorms when threat is high", () => {
            const weather = [
                {
                    precipitation: { probability: { percent: 50 } },
                    thunderstormProbability: 60,
                    weatherCondition: {
                        description: { text: "Thunderstorms" },
                    },
                },
            ];

            const result = getRainoutLikelihood(weather);

            expect(result.reason.toLowerCase()).toContain("thunderstorm");
        });

        it("should mention poor field conditions when rain accumulation is high", () => {
            const weather = [
                {
                    precipitation: { probability: { percent: 40 } },
                    weatherCondition: {
                        type: "RAIN",
                        description: { text: "Rain" },
                    },
                },
            ];

            calculatePrecipitation.mockReturnValue({ rain: 0.5, snow: 0 });

            const result = getRainoutLikelihood(weather);

            expect(result.reason.toLowerCase()).toContain("field conditions");
        });
    });

    describe("likelihood capping", () => {
        it("should cap likelihood at 100%", () => {
            const extremeWeather = [
                {
                    precipitation: { probability: { percent: 100 } },
                    thunderstormProbability: 100,
                },
            ];

            calculatePrecipitation.mockReturnValue({ rain: 2.0, snow: 0 });

            const result = getRainoutLikelihood(extremeWeather);

            expect(result.likelihood).toBeLessThanOrEqual(100);
        });
    });
});
