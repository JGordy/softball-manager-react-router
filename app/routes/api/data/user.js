import { readDocument } from "@/utils/databases";

export async function action({ request, params }) {
    const { userId } = await request.json();

    if (!userId) {
        return {};
    }

    try {
        const user = await readDocument("users", userId);

        return user;
    } catch (error) {
        console.error("Error getting user info: ", error);
        throw error;
    }
}
