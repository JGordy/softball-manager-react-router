import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
// import netlifyPlugin from '@netlify/vite-plugin-react-router'

export default defineConfig({
    build: {
        manifest: true,
        outDir: "build/client",
        ssr: "build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/server.js",
        ssrManifest: true,
    },
    plugins: [
        tailwindcss(),
        reactRouter(),
        tsconfigPaths(),
        // netlifyPlugin(),
    ],
    resolve: {
        alias: {
            "@": "/app",
            "@actions": "/actions",
            "@components": "/app/components",
            "@constants": "/app/constants",
            "@contexts": "/app/contexts",
            "@forms": "/app/forms",
            "@hooks": "/app/hooks",
            "@loaders": "/app/loaders",
            "@routes": "/app/routes",
            "@styles": "/app/styles",
            "@test-utils": "/app/test-utils",
            // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
            "@tabler/icons-react":
                "@tabler/icons-react/dist/esm/icons/index.mjs",
        },
    },
});
