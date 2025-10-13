import { useEffect, useState, useCallback, useMemo } from "react";

import { account } from "@/appwrite";

import { readDocument } from "@/utils/databases";

import AuthContext from "./authContext";

export default function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);

    useEffect(() => {
        const getLoggedInUser = async () => {
            try {
                const currentUser = await account.get();
                setUserState((prev) =>
                    prev?.$id === currentUser?.$id ? prev : currentUser,
                );
            } catch (error) {
                setUserState((prev) => (prev === null ? prev : null)); // No logged-in user
            }
        };

        getLoggedInUser(); // Check on mount
    }, []);

    // Stable function exposed to consumers. Accepts optional user arg to set directly
    const getAndSetUser = useCallback(async (maybeUser) => {
        if (maybeUser) {
            setUserState((prev) =>
                prev?.$id === maybeUser?.$id ? prev : maybeUser,
            );
            return;
        }

        try {
            const currentUser = await account.get();
            setUserState((prev) =>
                prev?.$id === currentUser?.$id ? prev : currentUser,
            );
        } catch (error) {
            // silently ignore
        }
    }, []);

    // Memoize the context value so consumers don't re-render just because the
    // provider re-rendered — value only changes when `user` or `getAndSetUser` changes.
    const ctxValue = useMemo(
        () => ({ user, setUser: getAndSetUser }),
        [user, getAndSetUser],
    );

    return (
        <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>
    );
}
