import { createAdminClient } from "@/utils/appwrite/server";

import { loader } from "../oauth";

jest.mock("react-router", () => ({
    redirect: jest.fn((url) => ({ status: 302, url })),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
}));

describe("OAuth Route Loader", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("redirects to login with error if provider is missing", async () => {
        const request = new Request("http://localhost/auth/oauth");
        const result = await loader({ request });
        expect(result.url).toBe("/login?error=missing_provider");
    });

    it("redirects to login with error if provider is invalid", async () => {
        const request = new Request(
            "http://localhost/auth/oauth?provider=invalid",
        );
        const result = await loader({ request });
        expect(result.url).toBe("/login?error=invalid_provider");
    });

    it("redirects to Appwrite OAuth URL on success", async () => {
        const request = new Request(
            "http://localhost/auth/oauth?provider=google",
        );
        const mockAccount = {
            createOAuth2Token: jest
                .fn()
                .mockResolvedValue("https://appwrite.io/oauth"),
        };
        createAdminClient.mockReturnValue({ account: mockAccount });

        const result = await loader({ request });

        expect(mockAccount.createOAuth2Token).toHaveBeenCalledWith(
            "google",
            "http://localhost/auth/callback",
            "http://localhost/login?error=oauth_failed",
        );
        expect(result.url).toBe("https://appwrite.io/oauth");
    });

    it("enforces HTTPS in production (non-localhost)", async () => {
        const request = new Request(
            "http://myapp.com/auth/oauth?provider=google",
        );
        const mockAccount = {
            createOAuth2Token: jest
                .fn()
                .mockResolvedValue("https://appwrite.io/oauth"),
        };
        createAdminClient.mockReturnValue({ account: mockAccount });

        await loader({ request });

        expect(mockAccount.createOAuth2Token).toHaveBeenCalledWith(
            "google",
            "https://myapp.com/auth/callback",
            "https://myapp.com/login?error=oauth_failed",
        );
    });

    it("redirects to login with error if Appwrite fails", async () => {
        const request = new Request(
            "http://localhost/auth/oauth?provider=google",
        );
        const mockAccount = {
            createOAuth2Token: jest
                .fn()
                .mockRejectedValue(new Error("Appwrite Error")),
        };
        createAdminClient.mockReturnValue({ account: mockAccount });

        const result = await loader({ request });
        expect(result.url).toBe("/login?error=oauth_error");
    });
});
