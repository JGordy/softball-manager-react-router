import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";

import { ColorSchemeScript, MantineProvider } from '@mantine/core';

import '@mantine/core/styles.css';
import '@mantine/core/styles/global.css';
import '@mantine/dates/styles.css';

import "@/styles/app.css";

import AuthProvider from '@/contexts/auth/authProvider';

// import { account } from '@/utils/appwrite/adminClient';
// import { Client, Account } from 'node-appwrite';

import theme from './theme';

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
];

export async function loader({ request }) {
    // console.log({ request, cookies: request.headers.get("Cookie") })
}

export function Layout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <ColorSchemeScript />
                <Meta />
                <Links />
            </head>
            <body>
                <AuthProvider>
                    <MantineProvider
                        defaultColorScheme="auto"
                        theme={theme}
                    >
                        {children}
                    </MantineProvider>
                </AuthProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
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
