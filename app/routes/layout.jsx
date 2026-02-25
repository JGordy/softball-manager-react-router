import { memo } from "react";

import { Outlet, redirect, useNavigation } from "react-router";

import { AppShell, Box, Container, LoadingOverlay } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import NavLinks from "@/components/NavLinks";
import DesktopNavbar from "@/components/DesktopNavbar";
import NotificationPromptDrawer from "@/components/NotificationPromptDrawer";
import InstallAppDrawer from "@/components/InstallAppDrawer";

import { createSessionClient } from "@/utils/appwrite/server";

import { isMobileUserAgent } from "@/utils/device";

export async function loader({ request }) {
    try {
        const { account } = await createSessionClient(request);
        const user = await account.get();

        // Check Device
        const isMobile = isMobileUserAgent(request);

        // Check for "Generic" names (Profile Incomplete)
        const isProfileIncomplete =
            !user.name || user.name.trim() === "" || user.name === "User";

        if (isProfileIncomplete) {
            throw redirect("/auth/setup");
        }

        return {
            user,
            isAuthenticated: true,
            isVerified: user.emailVerification,
            isMobile,
        };
    } catch (error) {
        if (error instanceof Response) throw error; // Handle redirects

        // If it's a standard "not logged in" error, redirect silently
        const isUnauthorized =
            error.code === "401" ||
            error.code === 401 ||
            error.status === 401 ||
            error.type === "general_unauthorized_scope" ||
            error.message?.includes('missing scopes (["account"])');

        if (isUnauthorized) {
            throw redirect("/login");
        }

        console.error("Layout loader - Auth failure:", error.message);
        // For other errors, use a generic error code to avoid leaking details in the URL
        throw redirect(`/login?error=auth_failure`);
    }
}

function Layout({ loaderData }) {
    const navigation = useNavigation();

    // Default the initial desktop query to the inverse of the server's user-agent Mobile check!
    const isDesktop = useMediaQuery("(min-width: 48em)", !loaderData.isMobile, {
        getInitialValueInEffect: false,
    });

    const isNavigating = navigation.state !== "idle";

    return (
        <AppShell
            header={{
                height: { base: 0, md: 60 },
            }}
        >
            <AppShell.Header withBorder={false} visibleFrom="md">
                <DesktopNavbar user={loaderData.user} />
            </AppShell.Header>

            <AppShell.Main>
                <LoadingOverlay
                    data-overlay="layout"
                    visible={isNavigating}
                    zIndex={150}
                    loaderProps={{
                        color: "lime",
                        size: "xl",
                        type: "dots",
                        style: { display: isNavigating ? undefined : "none" },
                    }}
                    overlayProps={{ radius: "sm", blur: 3 }}
                />

                <Container p={0} mih="90vh" size="xl">
                    <Outlet context={{ ...loaderData, isDesktop }} />
                </Container>

                <Box hiddenFrom="md">
                    <NavLinks user={loaderData.user} />
                </Box>
                <NotificationPromptDrawer />
                <InstallAppDrawer />
            </AppShell.Main>
        </AppShell>
    );
}

export default memo(Layout);
