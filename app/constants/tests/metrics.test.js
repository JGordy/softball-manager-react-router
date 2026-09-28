import { BATTING_METRIC_CONFIGS, formatMetricValue } from "../metrics";

describe("Batting Metrics Constants", () => {
    describe("formatMetricValue", () => {
        it("returns default .000 for null, undefined, empty string or NaN", () => {
            expect(formatMetricValue(null)).toBe(".000");
            expect(formatMetricValue(undefined)).toBe(".000");
            expect(formatMetricValue("")).toBe(".000");
            expect(formatMetricValue("not-a-number")).toBe(".000");
        });

        it("strips leading zeros by default", () => {
            expect(formatMetricValue(0.75)).toBe(".750");
            expect(formatMetricValue("0.650")).toBe(".650");
        });

        it("preserves leading zero when stripLeadingZero is false", () => {
            expect(formatMetricValue(0.75, 3, false)).toBe("0.750");
            expect(formatMetricValue(1.25, 3, false)).toBe("1.250");
        });
    });

    describe("BATTING_METRIC_CONFIGS", () => {
        const expectedMetrics = ["AVG", "OBP", "SLG", "OPS", "ISO"];

        it("defines all core batting rate metrics", () => {
            expect(Object.keys(BATTING_METRIC_CONFIGS)).toEqual(
                expectedMetrics,
            );
        });

        it("has valid labels, formulas, colors, and formatters for each metric", () => {
            expectedMetrics.forEach((metric) => {
                const config = BATTING_METRIC_CONFIGS[metric];
                expect(config.label).toBeDefined();
                expect(config.shortLabel).toBe(metric);
                expect(config.color).toBeDefined();
                expect(config.badgeColor).toBeDefined();
                expect(config.formula).toBeDefined();
                expect(config.summary).toBeDefined();
                expect(typeof config.format).toBe("function");

                // Test formatter output
                const formatted = config.format(0.5);
                expect(typeof formatted).toBe("string");
            });

            // OPS preserves leading digit (e.g. 0.500 or 1.200)
            expect(BATTING_METRIC_CONFIGS.OPS.format(0.85)).toBe("0.850");
            // AVG strips leading zero (.500)
            expect(BATTING_METRIC_CONFIGS.AVG.format(0.5)).toBe(".500");
        });
    });
});
