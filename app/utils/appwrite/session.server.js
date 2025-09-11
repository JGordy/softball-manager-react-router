import { createCookieSessionStorage } from "@remix-run/node";

export const authSession = createCookieSessionStorage({
    cookie: {
        name: "__session",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        secrets: [process.env.SESSION_SECRET],
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
});

export async function getAuthSession(request) {
    return authSession.getSession(request.headers.get("Cookie"));
}
export async function commitAuthSession(session) {
    return authSession.commitSession(session);
}
export async function destroyAuthSession(session) {
    return authSession.destroySession(session);
}
