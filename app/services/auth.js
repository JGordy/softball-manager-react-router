import { account } from "@/appwrite";

export const isAuth = () => {
    return new Promise(async (resolve) => {
        try {
            const session = await account.getSession("current");

            if (session) {
                resolve(session);
            }
            resolve(null);
        } catch (error) {
            console.log("No active session found");
            resolve(null);
        }
    });
};
