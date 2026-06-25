import { redirect } from "react-router";

import { createSessionClient } from "@/utils/appwrite/server";
import { isMobileUserAgent } from "@/utils/device";
import { mockContext } from "@/utils/mockContext";

import { redirectIfAuthenticated } from "../redirectIfAuthenticated";

jest.mock("react-router", () => ({
    redirect: jest.fn((url) => ({ status: 302, url })),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("@/utils/device", () => ({
    isMobileUserAgent: jest.fn(),
}));

describe("redirectIfAuthenticated", () => {
    let localMockContext;
    let mockUser = { $id: "user-123" };
    let request;

    beforeEach(() => {
        mockUser = { $id: "user-123" };
        jest.clearAllMocks();

        localMockContext = {
            get: jest.fn((ctx) => {
                if (
                    ctx === "userContext" ||
                    String(ctx).includes("userContext")
                ) {
                    return mockUser;
                }
                return {
                    account: { get: jest.fn().mockResolvedValue(mockUser) },
                };
            }),
        };
        request = new Request("http://localhost/login");
    });

    it("returns null if no active session", async () => {
        mockUser = null;

        const result = await redirectIfAuthenticated(request, localMockContext);

        expect(result).toBeNull();
    });

    it("redirects to / if authenticated on desktop", async () => {
        isMobileUserAgent.mockReturnValue(false);

        await redirectIfAuthenticated(request, localMockContext);

        expect(redirect).toHaveBeenCalledWith("/");
    });

    it("redirects to /dashboard if authenticated on mobile", async () => {
        isMobileUserAgent.mockReturnValue(true);

        await redirectIfAuthenticated(request, localMockContext);

        expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to custom path if provided on mobile", async () => {
        isMobileUserAgent.mockReturnValue(true);

        await redirectIfAuthenticated(request, localMockContext, "/profile");

        expect(redirect).toHaveBeenCalledWith("/profile");
    });

    it("redirects to custom path if provided on desktop", async () => {
        isMobileUserAgent.mockReturnValue(false);

        await redirectIfAuthenticated(request, localMockContext, "/profile");

        expect(redirect).toHaveBeenCalledWith("/profile");
    });
});
