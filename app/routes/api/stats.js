import { getStatsByUserId } from "@/loaders/users";
import { createSessionClient } from "@/utils/appwrite/server";

export async function loader({ request }) {
    const { account } = await createSessionClient(request);
    let userId;

    try {
        const user = await account.get();
        userId = user.$id;
    } catch (error) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await getStatsByUserId({ userId });
        return Response.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        return Response.json(
            { error: "Failed to fetch stats" },
            { status: 500 },
        );
    }
}
