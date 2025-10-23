import { useEffect } from "react";
import { Outlet, redirect } from "react-router";

import { account } from "@/utils/appwrite/adminClient";

import { useAuth } from "@/contexts/auth/useAuth";

import { getCurrentSession } from "@/services/auth";

export async function loader({ request }) {
    try {
        const session = await account.get();

        return { isLoggedIn: !!session };
    } catch (error) {
        return { isLoggedIn: false };
    }
}

export async function clientLoader({ request }) {
    const url = new URL(request.url);
    try {
        const session = await getCurrentSession();

        return {
            isLoggedIn: !!session,
            userId: session.userId,
            pathname: url.pathname,
            session,
        };
    } catch (error) {
        return { isLoggedIn: false };
    }
}

export default function AuthWrapper({ children, loaderData }) {
    const isLoggedIn = loaderData?.isLoggedIn;
    const userId = loaderData?.userId;
    const pathname = loaderData.pathname;
    const session = loaderData?.session;

    const { setUser } = useAuth();

    useEffect(() => {
        const authRoutes = ["/login", "/register"];

        if (!isLoggedIn && !authRoutes.includes(pathname)) {
            redirect("/login");
        }

        setUser(session);

        if (isLoggedIn && authRoutes.includes(pathname)) {
            redirect(`/user/${userId}`);
        }
    }, [isLoggedIn, userId, pathname]);

    // Handle the initial null state while checking authentication
    if (isLoggedIn === null) {
        return null;
    }

    return (
        <>
            <div>
                <Outlet />
            </div>
            {children}
        </>
    );
}
