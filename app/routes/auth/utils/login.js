import { account } from "@/appwrite";

export default async function login({ email, password }) {
    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        const session = await account.createEmailPasswordSession(email, password);
        return { session };
    } catch (error) {
        console.error(error);
        return { error };
    }
}
