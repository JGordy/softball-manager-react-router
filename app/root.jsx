import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";

import { parse } from "cookie";

import {
    ColorSchemeScript,
    MantineProvider,
    mantineHtmlProps,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

import "@mantine/core/styles.css";
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/global.css";
import "@mantine/dates/styles.css";
import "@mantine/carousel/styles.css";

import "@/styles/app.css";

import { createSessionClient } from "@/utils/appwrite/server";

import theme from "./theme";

export const links = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
    {
        rel: "manifest",
        href: "/manifest.json",
    },
];

export async function loader({ request }) {
    const cookieHeader = request.headers.get("Cookie");
    let darkMode = false;
    let preferences = {};

    if (cookieHeader) {
        try {
            const parsedCookies = parse(cookieHeader);
            darkMode = parsedCookies.darkMode === "true";
        } catch (error) {
            console.error("Error parsing cookie:", error);
        }
    }

    // Try to get user preferences from Appwrite if authenticated
    try {
        const { account } = await createSessionClient(request);
        preferences = await account.getPrefs();

        // Update darkMode from preferences if available
        if (preferences.darkMode !== undefined) {
            darkMode = preferences.darkMode === "true";
        }
    } catch (error) {
        // User not authenticated or error fetching preferences, use cookie value
        console.log("No user session in root loader");
    }

    return { darkMode, preferences };
}

function Layout({ children, context }) {
    // const { darkMode } = context;

    return (
        <html lang="en" {...mantineHtmlProps}>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <ColorSchemeScript
                    // TODO: Figure out the mismatch of themes before turning this back on
                    // defaultColorScheme={darkMode ? 'dark' : 'light'}
                    defaultColorScheme="auto"
                />
                <Meta />
                <Links />
            </head>
            <body>
                <MantineProvider
                    // TODO: Figure out the mismatch of themes before turning this back on
                    // defaultColorScheme={darkMode ? 'dark' : 'light'}
                    defaultColorScheme="auto"
                    theme={theme}
                >
                    <ModalsProvider>{children}</ModalsProvider>
                </MantineProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App({ loaderData }) {
    const { darkMode } = loaderData;

    return (
        <Layout context={{ darkMode }}>
            <Outlet />
        </Layout>
    );
}

export function ErrorBoundary({ error }) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
