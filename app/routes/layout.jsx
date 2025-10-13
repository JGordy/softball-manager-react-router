import { memo, useState, useEffect } from "react";

import { Outlet, useNavigation } from "react-router";

import { Container, LoadingOverlay } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import NavLinks from "@/components/NavLinks";

import { account } from "@/appwrite";

export async function clientLoader() {
    try {
        const session = await account.getSession("current");
        const { emailVerification } = await account.get();

        if (!session) {
            throw new Error("No active session found");
        }

        const { userId } = session;
        // Replace this with your actual user fetching logic
        const response = await fetch("/api/user", {
            method: "POST",
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }

        const user = await response.json();

        return { user, isVerified: emailVerification, session };
    } catch (error) {
        console.error("Error fetching user:", error);
        if (error.message === "No active session found") {
            throw redirect("/login");
        }
        return { user: {}, isVerified: false, session: null };
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return (
        <div>
            <main>
                <Notifications />
                <Container p="md" mih="90vh">
                    <Outlet />
                </Container>
                <NavLinks />
            </main>
        </div>
    );
}

function Layout({ loaderData }) {
    const navigation = useNavigation();

    const isNavigating = navigation.state !== "idle";

    const [overlayVisible, setOverlayVisible] = useState(isNavigating);

    useEffect(() => {
        let t;
        if (isNavigating) {
            // show immediately
            setOverlayVisible(true);
        } else {
            // hide after a small delay to avoid flicker
            t = setTimeout(() => setOverlayVisible(false), 100);
        }

        return () => {
            if (t) clearTimeout(t);
        };
    }, [isNavigating]);
    // no-op: overlayVisible is debounced from navigation.state to avoid flicker

    return (
        <div>
            <main>
                <Notifications />
                <LoadingOverlay
                    visible={overlayVisible}
                    zIndex={500}
                    loaderProps={{ color: "green", size: "xl", type: "dots" }}
                    overlayProps={{ radius: "sm", blur: 3 }}
                />
                <Container p="0" mih="90vh">
                    <Outlet context={{ ...loaderData }} />
                </Container>
                <NavLinks />
            </main>
        </div>
    );
}

export default memo(Layout);
