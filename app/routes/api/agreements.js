import { updateUser } from "@/actions/users";
import { createSessionClient } from "@/utils/appwrite/server";

export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { account } = await createSessionClient(request);
        const user = await account.get();

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.$id;

        // Update user preference in the users collection
        await updateUser({
            values: { agreedToTerms: true },
            userId,
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
