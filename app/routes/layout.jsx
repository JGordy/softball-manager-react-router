import { memo } from "react";

import { Outlet, redirect, useNavigation } from "react-router";

import { Container, LoadingOverlay } from "@mantine/core";

import NavLinks from "@/components/NavLinks";

import { createSessionClient } from "@/utils/appwrite/server";

export async function loader({ request }) {
    try {
        const { account } = await createSessionClient(request);
        const user = await account.get();

        // Check for "Generic" names (Profile Incomplete)
        const isProfileIncomplete = !user.name || user.name === "User";

        const url = new URL(request.url);
        if (isProfileIncomplete && url.pathname !== "/auth/setup") {
            throw redirect("/auth/setup");
        }

        return {
            user,
            isAuthenticated: true,
            isVerified: user.emailVerification,
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
        // For other errors, include the message for debugging
        throw redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
}

function Layout({ loaderData }) {
    const navigation = useNavigation();

    const isNavigating = navigation.state !== "idle";

    return (
        <div>
            <main>
                <LoadingOverlay
                    data-overlay="layout"
                    visible={isNavigating}
                    zIndex={150}
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
