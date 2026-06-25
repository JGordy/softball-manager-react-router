import { updateUser } from "@/actions/users";
import { userContext, appwriteClientContext } from "@/contexts/router";

export async function action({ request, context }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const sessionClient = context.get(appwriteClientContext);
        const user = context.get(userContext);

        if (!user || !sessionClient) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.$id;

        // Update user preference in the users collection
        await updateUser({
            values: { agreedToTerms: true },
            userId,
            client: sessionClient,
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error accepting agreements:", error);
        return Response.json(
            { error: error.message || "Failed to accept agreements" },
            { status: 500 },
        );
    }
}
