import { useEffect, useState } from "react";

import { account } from "@/appwrite";

import { readDocument } from "@/utils/databases";

import AuthContext from "./authContext";

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getLoggedInUser = async () => {
            try {
                const currentUser = await account.get();
                setUser(currentUser);
            } catch (error) {
                setUser(null); // No logged-in user
            }
        };

        getLoggedInUser(); // Check on mount
    }, []);

    const getAndSetUser = async () => {
        try {
            const currentUser = await account.get();
            setUser(currentUser);
        } catch (error) {
            console.log("Couldn't get user data");
        }
    };

    return <AuthContext.Provider value={{ user, setUser: getAndSetUser }}>{children}</AuthContext.Provider>;
}
