/**
 * Shared preference state config for fielding position selectors.
 * Used by both FieldingDepthChart (mobile) and DesktopFieldingDepthChart.
 */
export const PREFERENCE_CONFIG = {
    preferred: {
        color: "lime",
        cssVar: "var(--mantine-color-lime-6)",
        label: "Preferred",
    },
    disliked: {
        color: "red",
        cssVar: "var(--mantine-color-red-6)",
        label: "Dislikes",
    },
    neutral: {
        color: null,
        cssVar: undefined,
        label: null,
    },
};
