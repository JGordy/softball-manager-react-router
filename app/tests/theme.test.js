import theme from "../theme";

describe("Theme variantColorResolver", () => {
    it("should resolve filled lime and primary variants with #101720 dark text", () => {
        const limeFilled = theme.variantColorResolver({
            color: "lime",
            variant: "filled",
            theme,
        });
        expect(limeFilled.color).toBe("#101720");
        expect(limeFilled.background).toBe("var(--mantine-color-lime-filled)");

        const primaryFilled = theme.variantColorResolver({
            color: "primary",
            variant: "filled",
            theme,
        });
        expect(primaryFilled.color).toBe("#101720");
        expect(primaryFilled.background).toBe(
            "var(--mantine-color-lime-filled)",
        );

        // Supports shaded token notation like lime.5
        const limeShadedFilled = theme.variantColorResolver({
            color: "lime.5",
            variant: "filled",
            theme,
        });
        expect(limeShadedFilled.color).toBe("#101720");
        expect(limeShadedFilled.background).toBe(
            "var(--mantine-color-lime-filled)",
        );
    });

    it("should resolve light variant custom colors with soft design tokens for both base and shaded colors", () => {
        const testCases = [
            {
                color: "lime",
                bg: "var(--soft-lime-bg)",
                colorVar: "var(--soft-lime-color)",
            },
            {
                color: "lime.5",
                bg: "var(--soft-lime-bg)",
                colorVar: "var(--soft-lime-color)",
            },
            {
                color: "primary",
                bg: "var(--soft-lime-bg)",
                colorVar: "var(--soft-lime-color)",
            },
            {
                color: "blue",
                bg: "var(--soft-blue-bg)",
                colorVar: "var(--soft-blue-color)",
            },
            {
                color: "blue.5",
                bg: "var(--soft-blue-bg)",
                colorVar: "var(--soft-blue-color)",
            },
            {
                color: "red",
                bg: "var(--soft-red-bg)",
                colorVar: "var(--soft-red-color)",
            },
            {
                color: "red.5",
                bg: "var(--soft-red-bg)",
                colorVar: "var(--soft-red-color)",
            },
            {
                color: "orange",
                bg: "var(--soft-orange-bg)",
                colorVar: "var(--soft-orange-color)",
            },
            {
                color: "orange.5",
                bg: "var(--soft-orange-bg)",
                colorVar: "var(--soft-orange-color)",
            },
        ];

        for (const { color, bg, colorVar } of testCases) {
            const resolved = theme.variantColorResolver({
                color,
                variant: "light",
                theme,
            });
            expect(resolved.background).toBe(bg);
            expect(resolved.color).toBe(colorVar);
        }
    });

    it("should fallback to default variant resolver for other colors or variants", () => {
        const grayLight = theme.variantColorResolver({
            color: "gray",
            variant: "light",
            theme,
        });
        expect(grayLight).toBeDefined();
        expect(grayLight.background).toBe("rgba(0, 0, 0, 0.1)");

        const cyanOutline = theme.variantColorResolver({
            color: "cyan",
            variant: "outline",
            theme,
        });
        expect(cyanOutline).toBeDefined();
        expect(cyanOutline.background).toBe("transparent");
    });
});
