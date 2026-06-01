import { useComputedColorScheme } from "@mantine/core";

/**
 * Custom React hook that dynamically generates styles for React Joyride
 * tooltips based on the current Mantine color scheme (light or dark mode).
 * This aligns the onboarding styling with the Velocity Dark design system.
 *
 * @returns {Object} React Joyride options and styles configuration objects.
 */
export function useJoyrideThemeStyles() {
    const computedColorScheme = useComputedColorScheme("light");
    const isDark = computedColorScheme === "dark";

    const options = {
        arrowColor: isDark ? "#1F2937" : "#FFFFFF",
        backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
        overlayColor: isDark
            ? "rgba(17, 24, 39, 0.85)"
            : "rgba(55, 65, 81, 0.4)",
        primaryColor: isDark ? "#CCFF33" : "#5C8A00", // Neon in dark mode, dark lime in light mode
        textColor: isDark ? "#FFFFFF" : "#111827",
        zIndex: 1000,
        showSkipButton: true,
    };

    const styles = {
        tooltip: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            color: isDark ? "#FFFFFF" : "#111827",
            textAlign: "left",
            fontFamily: "Open Sans, sans-serif",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: isDark
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)"
                : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        buttonClose: {
            color: isDark ? "#A0AEC0" : "#4A5568",
            outline: "none",
        },
        buttonPrimary: {
            backgroundColor: isDark ? "#CCFF33" : "#5C8A00",
            color: isDark ? "#111827" : "#FFFFFF",
            fontWeight: "bold",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            border: "none",
            outline: "none",
        },
        buttonBack: {
            color: isDark ? "#A0AEC0" : "#4A5568",
            marginRight: "8px",
            fontWeight: 600,
            fontSize: "14px",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            cursor: "pointer",
        },
        buttonSkip: {
            color: isDark ? "#A0AEC0" : "#4A5568",
            fontWeight: 600,
            fontSize: "14px",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            cursor: "pointer",
            marginRight: "auto",
        },
        beaconInner: {
            backgroundColor: isDark ? "#CCFF33" : "#111827",
        },
        beaconOuter: {
            borderColor: isDark ? "#CCFF33" : "#111827",
            backgroundColor: isDark
                ? "rgba(204, 255, 51, 0.2)"
                : "rgba(17, 24, 39, 0.2)",
        },
    };

    return { options, styles };
}
