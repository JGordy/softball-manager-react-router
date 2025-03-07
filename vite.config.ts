import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import netlifyPlugin from '@netlify/vite-plugin-react-router'

export default defineConfig({
    plugins: [
        tailwindcss(),
        reactRouter(),
        tsconfigPaths(),
        netlifyPlugin()],
    resolve: {
        alias: {
            '@': '/app',
            '@components': '/app/components',
            '@constants': '/app/constants',
            '@contexts': '/app/contexts',
            '@forms': '/app/forms',
            '@routes': '/app/routes',
            '@styles': '/app/styles',
            // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
            '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        },
    },
});
