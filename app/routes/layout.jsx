import { memo } from "react";

import { Outlet, redirect, useNavigation } from "react-router";

import { Container, LoadingOverlay } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import NavLinks from "@/components/NavLinks";

import {
    initializeAppwriteContext,
    getCurrentUser,
} from "@/utils/appwrite/context";

/**
 * Middleware to initialize Appwrite context for all child routes
 * This runs before the loader and makes the context available to all descendants
 */
export const middleware = [
    async ({ context, request }, next) => {
        await initializeAppwriteContext({ context, request });
        return next();
    },
];

export async function loader({ request, context }) {
    try {
        // Get the current user from context (already initialized by middleware)
        const user = await getCurrentUser({ request, context });

        return {
            user,
            isAuthenticated: true,
            isVerified: user.emailVerification,
        };
    } catch (error) {
        // No valid session - redirect to login
        throw redirect("/login");
    }
}

function Layout({ loaderData }) {
    const navigation = useNavigation();

    const isNavigating = navigation.state !== "idle";

    return (
        <div>
            <main>
                <Notifications />

                <LoadingOverlay
                    data-overlay="layout"
                    visible={isNavigating}
                    zIndex={500}
                    loaderProps={{
                        color: "green",
                        size: "xl",
                        type: "dots",
                        style: { display: isNavigating ? undefined : "none" },
                    }}
                    overlayProps={{ radius: "sm", blur: 3 }}
                />

                <Container p="0" mih="90vh">
                    <Outlet context={{ ...loaderData }} />
                </Container>

                <NavLinks user={loaderData.user} />
            </main>
        </div>
    );
}

export default memo(Layout);
