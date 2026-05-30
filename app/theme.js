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

        if (input.variant === "filled") {
            if (input.color === "lime" || input.color === "primary") {
                return {
                    ...defaultResolved,
                    background: "var(--mantine-color-lime-filled)",
                    hover: "var(--mantine-color-lime-filled-hover)",
                    color: "#101720",
                };
            }
        }

        if (input.variant === "light") {
            const customColors = {
                lime: {
                    bg: "rgba(193, 235, 51, 0.12)",
                    hover: "rgba(193, 235, 51, 0.22)",
                    color: "#c1eb33",
                },
                blue: {
                    bg: "rgba(59, 130, 246, 0.15)",
                    hover: "rgba(59, 130, 246, 0.25)",
                    color: "#60a5fa",
                },
                red: {
                    bg: "rgba(239, 68, 68, 0.15)",
                    hover: "rgba(239, 68, 68, 0.25)",
                    color: "#f87171",
                },
                orange: {
                    bg: "rgba(249, 115, 22, 0.15)",
                    hover: "rgba(249, 115, 22, 0.25)",
                    color: "#fb923c",
                },
            };

            const colorKey = input.color === "primary" ? "lime" : input.color;
            const soft = customColors[colorKey];
            if (soft) {
                return {
                    ...defaultResolved,
                    background: soft.bg,
                    hover: soft.hover,
                    color: soft.color,
                };
            }
        }

        return defaultResolved;
    },
});

export default theme;
