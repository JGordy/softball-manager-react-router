import { getStatsByUserId } from "@/loaders/users";
import { userContext, appwriteClientContext } from "@/contexts/router";

export async function loader({ context }) {
    const sessionClient = context.get(appwriteClientContext);
    const user = context.get(userContext);

    if (!user || !sessionClient) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.$id;

    try {
        const stats = await getStatsByUserId({ userId, client: sessionClient });
        return Response.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        return Response.json(
            { error: "Failed to fetch stats" },
            { status: 500 },
        );
    }
}
