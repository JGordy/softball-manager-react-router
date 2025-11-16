import { memo } from "react";

import { Outlet, redirect, useNavigation } from "react-router";

import { Container, LoadingOverlay } from "@mantine/core";

import NavLinks from "@/components/NavLinks";

import { createSessionClient } from "@/utils/appwrite/server";

export async function loader({ request }) {
    try {
        const { account } = await createSessionClient(request);
        const user = await account.get();
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
