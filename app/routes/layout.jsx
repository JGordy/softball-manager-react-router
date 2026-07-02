import { memo } from "react";

import { Outlet, redirect, useNavigation } from "react-router";

import { AppShell, Box, Container, LoadingOverlay } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import NavLinks from "@/components/NavLinks";
import DesktopNavbar from "@/components/DesktopNavbar";
import NotificationPromptDrawer from "@/components/NotificationPromptDrawer";
import InstallAppDrawer from "@/components/InstallAppDrawer";
import AgreementModal from "@/components/AgreementModal";

import { userContext, appwriteClientContext } from "@/contexts/router";
import { getUserById } from "@/loaders/users";

import { isMobileUserAgent } from "@/utils/device";

export async function loader({ request, context }) {
    const sessionClient = context.get(appwriteClientContext);
    const accountUser = context.get(userContext);

    if (!accountUser || !sessionClient) {
        throw redirect("/login");
    }

    let userDoc = {};
    try {
        userDoc =
            (await getUserById({
                userId: accountUser.$id,
                client: sessionClient,
            })) || {};
    } catch (e) {
        console.error("Layout loader - Failed to fetch user doc:", e.message);
        // new users might not have a doc yet
    }

    const user = { ...accountUser, ...userDoc };

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
}

function Layout({ loaderData }) {
    const navigation = useNavigation();

    const isDesktop = useMediaQuery("(min-width: 62em)", !loaderData.isMobile);

    const isNavigating = navigation.state !== "idle";

    return (
        <AppShell
            header={{
                height: { base: 0, md: 60 },
            }}
        >
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
                style={{ position: "fixed", inset: 0 }}
            />

            <AppShell.Header withBorder={false} visibleFrom="md">
                <DesktopNavbar user={loaderData.user} />
            </AppShell.Header>

            <AppShell.Main>
                <Container px={0} mih="90vh" size="xl" pb="7rem">
                    <Outlet context={{ ...loaderData, isDesktop }} />
                </Container>

                <Box hiddenFrom="md">
                    <NavLinks user={loaderData.user} isDesktop={isDesktop} />
                </Box>
                <NotificationPromptDrawer />
                <InstallAppDrawer />
                <AgreementModal user={loaderData.user} />
            </AppShell.Main>
        </AppShell>
    );
}

export default memo(Layout);
