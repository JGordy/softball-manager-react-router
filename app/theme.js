import { createTheme } from "@mantine/core";

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
            "#a8e446",
            "#9be02b",
            "#7fbf0a",
            "#629402",
            "#416500",
        ],
    },
    primaryColor: "lime",
    primaryShade: { light: 7, dark: 4 },
    autoContrast: true,
});

export default theme;
