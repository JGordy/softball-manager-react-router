import { createSessionClient } from "@/utils/appwrite/server";
import { updateUserPrefs } from "@/actions/users";

/**
 * Action handler for updating user preferences via API.
 * Acts as a resource route so React Router doesn't need to fetch
 * settings UI component bundles when client-side code modifies settings.
 *
 * @param {Object} context - React Router action context.
 * @param {Request} context.request - The incoming request.
 * @returns {Promise<Response>} JSON response indicating success or failure.
 */
export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const formData = await request.formData();
        const {
            _action,
            userId: _userId,
            ...values
        } = Object.fromEntries(formData);

        let client;
        try {
            client = await createSessionClient(request);
            const user = await client.account.get();
            if (!user) {
                return Response.json(
                    { error: "Unauthorized" },
                    { status: 401 },
                );
            }
        } catch {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (_action === "update-user-preferences") {
            const result = await updateUserPrefs({ values, client });
            // Since result contains a body, we cannot return HTTP 204 directly
            // via Response.json() without throwing an "Invalid response status code 204" RangeError.
            // Map 204 to 200 for successful JSON responses, and normalize result's status field if it exists.
            const httpStatus =
                result?.status === 204 ? 200 : result?.status || 200;
            if (result && result.status === 204) {
                result.status = 200;
            }
            return Response.json(result, { status: httpStatus });
        }

        return Response.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("API error updating preferences:", error);
        return Response.json(
            { error: error.message || "Internal server error" },
            { status: 500 },
        );
    }
}
