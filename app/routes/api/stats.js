import { getStatsByUserId } from "@/loaders/users";

export async function loader({ request }) {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
        return new Response(JSON.stringify({ error: "UserId is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const stats = await getStatsByUserId({ userId });
        return new Response(JSON.stringify(stats), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch stats" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
