import { useComputedColorScheme } from "@mantine/core";
import { renderHook } from "@testing-library/react";
import { useJoyrideThemeStyles } from "../useJoyrideThemeStyles";

jest.mock("@mantine/core", () => {
    const actual = jest.requireActual("@mantine/core");
    return {
        ...actual,
        useComputedColorScheme: jest.fn(),
    };
});

describe("useJoyrideThemeStyles", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return light theme styles when color scheme is light", () => {
        useComputedColorScheme.mockReturnValue("light");
        const { result } = renderHook(() => useJoyrideThemeStyles());

        expect(result.current.options.backgroundColor).toBe("#FFFFFF");
        expect(result.current.options.textColor).toBe("#111827");
        expect(result.current.options.primaryColor).toBe("#5C8A00");
        expect(result.current.styles.tooltip.backgroundColor).toBe("#FFFFFF");
        expect(result.current.styles.tooltip.color).toBe("#111827");
        expect(result.current.styles.buttonPrimary.backgroundColor).toBe(
            "#5C8A00",
        );
        expect(result.current.styles.beaconInner.backgroundColor).toBe(
            "#111827",
        );
    });

    it("should return dark theme styles when color scheme is dark", () => {
        useComputedColorScheme.mockReturnValue("dark");
        const { result } = renderHook(() => useJoyrideThemeStyles());

        expect(result.current.options.backgroundColor).toBe("#1F2937");
        expect(result.current.options.textColor).toBe("#FFFFFF");
        expect(result.current.options.primaryColor).toBe("#CCFF33");
        expect(result.current.styles.tooltip.backgroundColor).toBe("#1F2937");
        expect(result.current.styles.tooltip.color).toBe("#FFFFFF");
        expect(result.current.styles.buttonPrimary.backgroundColor).toBe(
            "#CCFF33",
        );
        expect(result.current.styles.beaconInner.backgroundColor).toBe(
            "#CCFF33",
        );
    });
});
