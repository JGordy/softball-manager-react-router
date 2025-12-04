import { parseSessionCookie } from "@/utils/appwrite/server";

/**
 * API route to get the current session token
 * Used by client-side code to authenticate with Appwrite Client SDK
 */
export async function loader({ request }) {
    const cookieHeader = request.headers.get("Cookie");
    const session = parseSessionCookie(cookieHeader);

    return Response.json({ session });
}
