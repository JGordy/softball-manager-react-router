import { createTheme, defaultVariantColorsResolver } from "@mantine/core";

const theme = createTheme({
    fontFamily: "Open Sans, sans-serif",
    colors: {
        green: [
            "#eafcef",
            "#d9f6df",
            "#b1ebbe",
            "#86e09a",
            "#63d77c",
            "#4dd269",
            "#40cf5e",
            "#31b74e",
            "#27a343",
            "#168d36",
        ],
        lime: [
            "#f4fce3",
            "#e9f8c6",
            "#d4f19b",
            "#bdea6d",
            "#c1eb33",
            "#9be02b",
            "#c1eb33",
            "#7fbf0a",
            "#c1eb33",
            "#416500",
        ],
    },
    primaryColor: "lime",
    primaryShade: { light: 7 },
    autoContrast: true,
    components: {
        Avatar: {
            defaultProps: {
                variant: "light",
            },
        },
    },
    variantColorResolver: (input) => {
        const defaultResolved = defaultVariantColorsResolver(input);
        const baseColor = input.color?.split(".")[0];

        if (input.variant === "filled") {
            if (baseColor === "lime" || input.color === "primary") {
                return {
                    ...defaultResolved,
                    background: "var(--mantine-color-lime-filled)",
                    hover: "var(--mantine-color-lime-filled-hover)",
                    color: "#101720",
                };
            }
        }

        if (input.variant === "light") {
            const SOFT_COLORS = ["lime", "blue", "red", "orange"];
            const colorKey = input.color === "primary" ? "lime" : baseColor;

            if (SOFT_COLORS.includes(colorKey)) {
                return {
                    ...defaultResolved,
                    background: `var(--soft-${colorKey}-bg)`,
                    hover: `var(--soft-${colorKey}-hover)`,
                    color: `var(--soft-${colorKey}-color)`,
                };
            }
        }

        return defaultResolved;
    },
});

export default theme;
