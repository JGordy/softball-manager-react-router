import {
    subscribeToTeam,
    unsubscribeFromTeam,
    getTeamSubscriptionStatus,
} from "@/actions/notifications";

export async function action({ request }) {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const teamId = formData.get("teamId");
    const targetId = formData.get("targetId");

    if (!teamId || !targetId) {
        return Response.json(
            { error: "Team ID and Target ID are required" },
            { status: 400 },
        );
    }

    try {
        if (intent === "subscribe") {
            await subscribeToTeam({ teamId, targetId });
            return Response.json({ success: true, subscribed: true });
        } else if (intent === "unsubscribe") {
            await unsubscribeFromTeam({ teamId, targetId });
            return Response.json({ success: true, subscribed: false });
        } else {
            return Response.json({ error: "Invalid intent" }, { status: 400 });
        }
    } catch (error) {
        console.error("Notification preference error:", error);
        return Response.json(
            { error: "Failed to update preference" },
            { status: 500 },
        );
    }
}

export async function loader({ request }) {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");
    const targetId = url.searchParams.get("targetId");

    if (!teamId || !targetId) {
        return Response.json(
            { error: "Team ID and Target ID are required" },
            { status: 400 },
        );
    }

    try {
        const isSubscribed = await getTeamSubscriptionStatus({
            teamId,
            targetId,
        });
        return Response.json({ subscribed: isSubscribed });
    } catch (error) {
        console.error("Error checking subscription status:", error);
        return Response.json(
            { error: "Failed to check status" },
            { status: 500 },
        );
    }
}
