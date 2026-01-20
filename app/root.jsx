import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { getMessagingIfSupported } from "@/utils/firebase";
import { showNotification } from "@/utils/showNotification";
import {
    isRouteErrorResponse,
    Link,
    Links,
    Meta,
    useNavigate,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";

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
import { Notifications, notifications } from "@mantine/notifications";

import "@mantine/core/styles.css";
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/global.css";
import "@mantine/dates/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";

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
                    <Notifications position="top-center" zIndex={10000} />
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
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribe;
        getMessagingIfSupported().then((messaging) => {
            if (messaging) {
                unsubscribe = onMessage(messaging, (payload) => {
                    let data = payload.data || {};

                    // Handle potential stringified data
                    if (typeof data === "string") {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            console.error(
                                "Failed to parse notification data:",
                                e,
                            );
                        }
                    }

                    const url = data.url || (data.data && data.data.url);
                    const notificationId = `push-${Date.now()}`;

                    showNotification({
                        id: notificationId,
                        title:
                            payload.notification?.title ||
                            data.title ||
                            "Notification",
                        message: payload.notification?.body || data.body || "",
                        variant: "info",
                        autoClose: 5000,
                        onClick: () => {
                            notifications.hide(notificationId);
                            if (url) {
                                // If it's an absolute URL for the same origin, or relative
                                if (
                                    url.startsWith("/") ||
                                    url.includes(window.location.origin)
                                ) {
                                    const path = url.startsWith("/")
                                        ? url
                                        : url.replace(
                                              window.location.origin,
                                              "",
                                          );
                                    navigate(path);
                                } else {
                                    window.open(url, "_blank");
                                }
                            }
                        },
                    });
                });
            }
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

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
        <Layout>
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
        </Layout>
    );
}
