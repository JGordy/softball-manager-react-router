import {
    createAdminClient,
    createSessionClientFromSecret,
    serializeSessionCookie,
} from "@/utils/appwrite/server";

import {
    readDocument,
    createDocument,
    updateDocument,
} from "@/utils/databases";

import { loader } from "../callback";

jest.mock("react-router", () => ({
    redirect: jest.fn((url, init) => {
        return new Response(null, {
            status: 302,
            headers: {
                Location: url,
                ...(init?.headers || {}),
            },
        });
    }),
}));

// Helper to check if it's a redirect response
const isRedirect = (res) =>
    res instanceof Response && [301, 302, 303, 307, 308].includes(res.status);
const getRedirectUrl = (res) => res.headers.get("Location");

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
    createSessionClientFromSecret: jest.fn(),
    serializeSessionCookie: jest.fn(),
}));

jest.mock("@/utils/databases", () => ({
    readDocument: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

describe("OAuth Callback Route Loader", () => {
    let mockAdminAccount, mockAdminUsers, mockSessionAccount;

    beforeEach(() => {
        mockAdminAccount = {
            createSession: jest.fn(),
        };
        mockAdminUsers = {
            get: jest.fn(),
        };
        mockSessionAccount = {
            listIdentities: jest.fn(),
            updatePrefs: jest.fn(),
        };
        createAdminClient.mockReturnValue({
            account: mockAdminAccount,
            users: mockAdminUsers,
        });
        createSessionClientFromSecret.mockReturnValue({
            account: mockSessionAccount,
        });

        global.fetch = jest.fn();
        jest.clearAllMocks();
    });

    it("throws redirect if missing parameters", async () => {
        const request = new Request("http://localhost/auth/callback");
        try {
            await loader({ request });
            fail("Should have thrown redirect");
        } catch (error) {
            expect(isRedirect(error)).toBe(true);
            expect(getRedirectUrl(error)).toBe("/login?error=invalid_session");
        }
    });

    it("successfully handles callback and creates user document if missing", async () => {
        const url =
            "http://localhost/auth/callback?userId=user1&secret=secret123";
        const request = new Request(url);

        mockAdminAccount.createSession.mockResolvedValue({
            secret: "session-secret",
        });
        readDocument.mockRejectedValue({ code: 404 });
        mockAdminUsers.get.mockResolvedValue({
            name: "John Doe",
            email: "john@doe.com",
        });
        mockSessionAccount.listIdentities.mockResolvedValue({ identities: [] });
        serializeSessionCookie.mockReturnValue("cookie-string");

        try {
            await loader({ request });
            fail("Should have thrown redirect");
        } catch (error) {
            expect(isRedirect(error)).toBe(true);
            expect(mockAdminAccount.createSession).toHaveBeenCalledWith(
                "user1",
                "secret123",
            );
            expect(createDocument).toHaveBeenCalledWith("users", "user1", {
                userId: "user1",
                firstName: "John",
                lastName: "Doe",
                email: "john@doe.com",
            });
            expect(getRedirectUrl(error)).toBe("/");
            expect(error.headers.get("Set-Cookie")).toBe("cookie-string");
        }
    });

    it("fetches and saves Google avatar if applicable", async () => {
        const url =
            "http://localhost/auth/callback?userId=user1&secret=secret123";
        const request = new Request(url);

        mockAdminAccount.createSession.mockResolvedValue({
            secret: "session-secret",
        });
        readDocument.mockResolvedValue({}); // User exists

        mockSessionAccount.listIdentities.mockResolvedValue({
            identities: [
                { provider: "google", providerAccessToken: "google-token" },
            ],
        });

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ picture: "http://google.com/photo.jpg" }),
        });

        serializeSessionCookie.mockReturnValue("cookie-string");

        try {
            await loader({ request });
            fail("Should have thrown redirect");
        } catch (error) {
            expect(isRedirect(error)).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                expect.any(Object),
            );
            expect(mockSessionAccount.updatePrefs).toHaveBeenCalledWith({
                avatarUrl: "http://google.com/photo.jpg",
            });
            expect(updateDocument).toHaveBeenCalledWith("users", "user1", {
                avatarUrl: "http://google.com/photo.jpg",
            });
            expect(getRedirectUrl(error)).toBe("/");
        }
    });

    it("redirects to login on exchange error", async () => {
        const url =
            "http://localhost/auth/callback?userId=user1&secret=secret123";
        const request = new Request(url);

        mockAdminAccount.createSession.mockRejectedValue(
            new Error("Exchange failed"),
        );

        try {
            await loader({ request });
            fail("Should have thrown redirect");
        } catch (error) {
            expect(isRedirect(error)).toBe(true);
            expect(getRedirectUrl(error)).toBe("/login?error=callback_error");
        }
    });
});
