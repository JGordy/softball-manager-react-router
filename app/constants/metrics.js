/**
 * Format batting and rate metric values for display.
 *
 * @param {number|string} val - Raw stat value
 * @param {number} [decimals=3] - Decimal precision
 * @param {boolean} [stripLeadingZero=true] - Strip leading zero (e.g. .750 instead of 0.750)
 * @returns {string} Formatted stat string
 */
export const formatMetricValue = (
    val,
    decimals = 3,
    stripLeadingZero = true,
) => {
    if (val === undefined || val === null || val === "") return ".000";
    const num = Number(val);
    if (isNaN(num)) return ".000";
    const formatted = num.toFixed(decimals);
    return stripLeadingZero ? formatted.replace(/^0/, "") : formatted;
};

/**
 * Batting metric series configurations with Velocity Dark system colors,
 * formulas, and plain-English explanations.
 * Shared across player progression and team progression trends.
 */
export const BATTING_METRIC_CONFIGS = {
    AVG: {
        label: "Batting Avg",
        shortLabel: "AVG",
        color: "var(--metric-avg-color)",
        badgeColor: "lime",
        formula: "Hits / At-Bats",
        summary:
            "Measures hitting frequency. Shows how often you get a base hit per official at-bat.",
        format: (val) => formatMetricValue(val, 3, true),
        max: 1.0,
    },
    OBP: {
        label: "On-Base %",
        shortLabel: "OBP",
        color: "var(--metric-obp-color)",
        badgeColor: "cyan",
        formula: "(Hits + BB) / (AB + BB + SF)",
        summary:
            "Measures how often you reach base safely without making an out (including walks).",
        format: (val) => formatMetricValue(val, 3, true),
        max: 1.0,
    },
    SLG: {
        label: "Slugging %",
        shortLabel: "SLG",
        color: "var(--metric-slg-color)",
        badgeColor: "grape",
        formula: "Total Bases / At-Bats",
        summary:
            "Measures hitting power. Doubles (2), triples (3), and home runs (4) weigh more than singles (1).",
        format: (val) => formatMetricValue(val, 3, true),
        max: 4.0,
    },
    OPS: {
        label: "OPS",
        shortLabel: "OPS",
        color: "var(--metric-ops-color)",
        badgeColor: "orange",
        formula: "On-Base + Slugging",
        summary:
            "Combines getting on base (OBP) and hitting for power (SLG) into a single offensive rating.",
        format: (val) => formatMetricValue(val, 3, false),
        max: 5.0,
    },
    ISO: {
        label: "ISO Power",
        shortLabel: "ISO",
        color: "var(--metric-iso-color)",
        badgeColor: "yellow",
        formula: "Slugging - Batting Avg",
        summary:
            "Isolated Power measures pure extra-base thump, removing singles to evaluate true extra-base ability.",
        format: (val) => formatMetricValue(val, 3, true),
        max: 3.0,
    },
};
