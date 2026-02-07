import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";
// import netlifyPlugin from '@netlify/vite-plugin-react-router'

export default defineConfig({
    build: {
        sourcemap: true,
        manifest: true,
        outDir: "build/client",
        ssr: "build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/server.js",
        ssrManifest: true,
    },
    plugins: [
        tailwindcss(),
        reactRouter(),
        tsconfigPaths(),
        process.env.SENTRY_AUTH_TOKEN
            ? sentryVitePlugin({
                  org: process.env.SENTRY_ORG,
                  project: process.env.SENTRY_PROJECT,
                  authToken: process.env.SENTRY_AUTH_TOKEN,
              })
            : null,
        // netlifyPlugin(),
    ].filter(Boolean),
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
            // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
            "@tabler/icons-react":
                "@tabler/icons-react/dist/esm/icons/index.mjs",
        },
    },
});
