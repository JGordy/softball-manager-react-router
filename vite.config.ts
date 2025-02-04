import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    resolve: {
        alias: {
            '@': '/app',
            '@components': '/app/components',
            '@constants': '/app/constants',
            '@routes': '/app/routes',
            '@styles': '/app/styles',
        },
    },
});
