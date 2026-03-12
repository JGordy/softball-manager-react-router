import { useEffect } from "react";

import {
    useLoaderData,
    useLocation,
    useMatches,
    isRouteErrorResponse,
    Link,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";

import * as Sentry from "@sentry/react-router";

import { parse } from "cookie";

import {
    ColorSchemeScript,
    MantineProvider,
    mantineHtmlProps,
    Container,
    Title,
    Text,
    Button,
    Stack,
    Code,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";

import "@mantine/core/styles.css";
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/global.css";
import "@mantine/dates/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";

import "@/styles/app.css";

import { usePushNotificationListener } from "@/hooks/usePushNotificationListener";
import { NotificationsProvider } from "@/context/NotificationsContext";

import { createSessionClient } from "@/utils/appwrite/server";
import UmamiTracker from "@/components/UmamiTracker";

import theme from "./theme";

if (
    !import.meta.env.SSR &&
    import.meta.env.PROD &&
    import.meta.env.VITE_SENTRY_DSN
) {
    const tracesSampleRate = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE)
        : 0.2;

    const validatedSampleRate =
        Number.isFinite(tracesSampleRate) &&
        tracesSampleRate >= 0 &&
        tracesSampleRate <= 1
            ? tracesSampleRate
            : 0.2;

    try {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            enabled: true,
            integrations: [
                Sentry.browserTracingIntegration({
                    useEffect,
                    useLocation,
                    useMatches,
                }),
                Sentry.replayIntegration(),
            ],
            tracesSampleRate: validatedSampleRate,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
        });
    } catch (error) {
        console.warn("Failed to initialize Sentry:", error);
    }
}

export const links = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto:wght@500&display=swap",
    },
    {
        rel: "manifest",
        href: "/manifest.json",
    },
    {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: "/android-chrome-icon192x192.png",
    },
];

export async function loader({ request }) {
    const cookieHeader = request.headers.get("Cookie");
    let themePreference = "auto";
    let preferences = {};

    if (cookieHeader) {
        try {
            const parsedCookies = parse(cookieHeader);
            if (parsedCookies.themePreference) {
                themePreference = parsedCookies.themePreference;
            }
        } catch (error) {
            console.error("Error parsing cookie:", error);
        }
    }

    // Try to get user preferences from Appwrite if authenticated
    try {
        const { account } = await createSessionClient(request);
        preferences = await account.getPrefs();

        // Update themePreference from preferences if available
        if (preferences.themePreference) {
            themePreference = preferences.themePreference;
        }
    } catch (error) {
        // User not authenticated or error fetching preferences, use cookie value
    }

    // Validate themePreference
    const validThemes = ["light", "dark", "auto"];
    if (!validThemes.includes(themePreference)) {
        themePreference = "auto";
    }

    return { themePreference, preferences };
}

export function Layout({ children }) {
    let themePreference = "auto";
    try {
        const data = useLoaderData();
        if (data) {
            themePreference = data.themePreference || "auto";
        }
    } catch (e) {
        // useLoaderData might throw in some error contexts or during initial SSR states
    }

    // Defensive validation
    const validThemes = ["light", "dark", "auto"];
    if (!validThemes.includes(themePreference)) {
        themePreference = "auto";
    }

    return (
        <html lang="en" {...mantineHtmlProps}>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />

                {/* Umami Tracking Script */}
                {import.meta.env.PROD &&
                    import.meta.env.VITE_UMAMI_WEBSITE_ID &&
                    import.meta.env.VITE_UMAMI_SCRIPT_URL && (
                        <script
                            async
                            defer
                            data-website-id={
                                import.meta.env.VITE_UMAMI_WEBSITE_ID
                            }
                            src={import.meta.env.VITE_UMAMI_SCRIPT_URL}
                        ></script>
                    )}

                <ColorSchemeScript defaultColorScheme={themePreference} />
                <Meta />
                <Links />
            </head>
            <body>
                <MantineProvider
                    defaultColorScheme={themePreference}
                    theme={theme}
                >
                    <Notifications position="top-center" zIndex={10000} />
                    <ModalsProvider>{children}</ModalsProvider>
                </MantineProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    usePushNotificationListener();

    return (
        <NotificationsProvider>
            {import.meta.env.PROD &&
                import.meta.env.VITE_UMAMI_WEBSITE_ID &&
                import.meta.env.VITE_UMAMI_SCRIPT_URL && <UmamiTracker />}
            <Outlet />
        </NotificationsProvider>
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
    } else if (error && error instanceof Error) {
        Sentry.captureException(error);

        if (import.meta.env.DEV) {
            details = error.message;
            stack = error.stack;
        }
    }

    return (
        <Container size="sm" py="xl">
            <Stack gap="md">
                <Title order={1}>{message}</Title>
                <Text size="lg">{details}</Text>
                {stack && (
                    <Code block style={{ whiteSpace: "pre-wrap" }}>
                        {stack}
                    </Code>
                )}
                <Button component={Link} to="/" variant="filled" mt="md">
                    Go to Home
                </Button>
            </Stack>
        </Container>
    );
}
