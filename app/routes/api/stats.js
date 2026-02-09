import { getStatsByUserId } from "@/loaders/users";

export async function loader({ request }) {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
        return Response.json({ error: "UserId is required" }, { status: 400 });
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
