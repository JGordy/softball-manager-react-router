import { createTheme } from '@mantine/core';

const theme = createTheme({
    fontFamily: 'Open Sans, sans-serif',
    colors: {
        'green': ["#eafcef", "#d9f6df", "#b1ebbe", "#86e09a", "#63d77c", "#4dd269", "#40cf5e", "#31b74e", "#27a343", "#168d36"],
    },
    primaryColor: 'green',
    autoContrast: true,
});

export default theme;