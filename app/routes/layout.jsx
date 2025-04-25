import { memo } from 'react';

import { Outlet, useNavigation } from "react-router";

import { Container, LoadingOverlay } from '@mantine/core';
import { Notifications } from "@mantine/notifications";

import NavLinks from "@/components/NavLinks";

import { account } from '@/appwrite';

export async function clientLoader() {
    try {
        const session = await account.getSession("current");
        const { emailVerification } = await account.get();

        if (!session) {
            throw new Error('No active session found');
        }

        const { userId } = session;
        // Replace this with your actual user fetching logic
        const response = await fetch('/api/user', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }

        const user = await response.json();

        return { user, isVerified: emailVerification, session };
    } catch (error) {
        console.error('Error fetching user:', error);
        if (error.message === 'No active session found') {
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
    );;
}

function Layout({ loaderData }) {
    const navigation = useNavigation();
    const isNavigating = Boolean(navigation.location);

    return (
        <div>
            <main>
                <Notifications />
                <LoadingOverlay
                    visible={isNavigating}
                    zIndex={500}
                    loaderProps={{ color: 'green', size: 'xl', type: 'dots' }}
                    overlayProps={{ radius: "sm", blur: 3, }}
                />
                <Container p="md" mih="90vh">
                    <Outlet context={{ ...loaderData }} />
                </Container>
                <NavLinks />
            </main>
        </div>
    );
}

export default memo(Layout);