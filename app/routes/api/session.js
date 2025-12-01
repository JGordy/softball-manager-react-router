/**
 * API route to get the current session token
 * Used by client-side code to authenticate with Appwrite Client SDK
 */
export async function loader({ request }) {
    const cookieHeader = request.headers.get("Cookie");

    // Parse session from cookie
    const cookies = cookieHeader?.split(";") || [];
    let session = null;
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "appwrite-session") {
            session = value;
            break;
        }
    }

    return Response.json({ session });
}
