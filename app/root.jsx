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
import "@mantine/core/styles/global.css";
import "@mantine/dates/styles.css";

import "@/styles/app.css";

import AuthProvider from "@/contexts/auth/authProvider";

import { account } from "@/utils/appwrite/sessionClient";

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
    let darkMode = false; // Default to false if cookie is not found or invalid

    if (cookieHeader) {
        try {
            const parsedCookies = parse(cookieHeader);
            darkMode = parsedCookies.darkMode === "true";
        } catch (error) {
            console.error("Error parsing cookie:", error);
        }
    }

    return { darkMode, preferences: {} };
}

export async function clientLoader({ request }) {
    try {
        const preferences = await account.getPrefs();

        if (preferences.darkMode === "true") {
            // Set the cookie using document.cookie
            document.cookie = "darkMode=true; path=/";
        } else {
            document.cookie = "darkMode=false; path=/";
        }

        return { preferences };
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return { error: "Failed to fetch preferences" };
    }
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
                <AuthProvider>
                    <MantineProvider
                        // TODO: Figure out the mismatch of themes before turning this back on
                        // defaultColorScheme={darkMode ? 'dark' : 'light'}
                        defaultColorScheme="auto"
                        theme={theme}
                    >
                        <ModalsProvider>{children}</ModalsProvider>
                    </MantineProvider>
                </AuthProvider>
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
