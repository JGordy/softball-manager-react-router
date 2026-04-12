import {
    parseSessionCookie,
    createSessionClientFromSecret,
} from "@/utils/appwrite/server";

/**
 * API route to get the current session JWT
 * Used by client-side code to authenticate with Appwrite Client SDK
 */
export async function loader({ request }) {
    const cookieHeader = request.headers.get("Cookie");
    const session = parseSessionCookie(cookieHeader);

    if (!session) {
        return Response.json({ jwt: null });
    }

    try {
        const { account } = createSessionClientFromSecret(session);
        const jwtResponse = await account.createJWT();
        return Response.json({ jwt: jwtResponse.jwt });
    } catch (error) {
        console.error("Failed to create JWT:", error);
        return Response.json({ jwt: null }, { status: 500 });
    }
}
