import { useEffect, useState, useCallback, useMemo } from "react";

import { account } from "@/appwrite";

import { getCurrentSession } from "@/services/auth";

import AuthContext from "./authContext";

export default function AuthProvider({ children }) {
    const [userAccount, setAccountState] = useState(null);
    const [session, setSession] = useState(null);

    useEffect(() => {
        const getLoggedInUser = async () => {
            try {
                const currentUser = await account.get();
                setAccountState((prev) =>
                    prev?.$id === currentUser?.$id ? prev : currentUser,
                );

                const session = await getCurrentSession();
                setSession(session);
            } catch (error) {
                setAccountState((prev) => (prev === null ? prev : null)); // No logged-in user
            }
        };

        getLoggedInUser(); // Check on mount
    }, []);

    // Stable function exposed to consumers. Accepts optional user arg to set directly
    const getAndSetUser = useCallback(async (maybeUser) => {
        if (maybeUser) {
            setAccountState((prev) =>
                prev?.$id === maybeUser?.$id ? prev : maybeUser,
            );
            return;
        }

        try {
            const currentUser = await account.get();
            setAccountState((prev) =>
                prev?.$id === currentUser?.$id ? prev : currentUser,
            );
        } catch (error) {
            // silently ignore
        }
    }, []);

    // Memoize the context value so consumers don't re-render just because the
    // provider re-rendered — value only changes when `user` or `getAndSetUser` changes.
    const ctxValue = useMemo(
        () => ({ userAccount, session, setUser: getAndSetUser }),
        [userAccount, session, getAndSetUser],
    );

    return (
        <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>
    );
}
