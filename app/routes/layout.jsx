import { memo } from 'react';

import { Outlet } from "react-router";
import { Notifications } from "@mantine/notifications";

import NavLinks from "@/components/NavLinks";

import { account } from '@/appwrite';

export async function clientLoader() {
    try {
        const session = await account.getSession("current");

        if (!session) {
            throw redirect("/login");
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

        return { user };
    } catch (error) {
        console.error('Error fetching user:', error);
        return { user: {} };
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return (
        <div>
            <main>
                <Notifications />
                <Outlet />
                <NavLinks />
            </main>
        </div>
    );;
}

function Layout({ loaderData }) {
    const { user } = loaderData;

    return (
        <div>
            <main>
                <Notifications />
                <Outlet context={{ user }} />
                <NavLinks />
            </main>
        </div>
    );
}

export default memo(Layout);