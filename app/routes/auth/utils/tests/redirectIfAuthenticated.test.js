import { redirect } from "react-router";

import { createSessionClient } from "@/utils/appwrite/server";
import { isMobileUserAgent } from "@/utils/device";

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
    let mockAccount;

    beforeEach(() => {
        mockAccount = {
            get: jest.fn(),
        };
        createSessionClient.mockResolvedValue({ account: mockAccount });
        jest.clearAllMocks();
    });

    it("returns null if no active session", async () => {
        mockAccount.get.mockRejectedValue(new Error("No session"));
        const request = new Request("http://localhost/login");

        const result = await redirectIfAuthenticated(request);

        expect(result).toBeNull();
    });

    it("redirects to / if authenticated on desktop", async () => {
        mockAccount.get.mockResolvedValue({ $id: "user1" });
        isMobileUserAgent.mockReturnValue(false);
        const request = new Request("http://localhost/login");

        await redirectIfAuthenticated(request);

        expect(redirect).toHaveBeenCalledWith("/");
    });

    it("redirects to /dashboard if authenticated on mobile", async () => {
        mockAccount.get.mockResolvedValue({ $id: "user1" });
        isMobileUserAgent.mockReturnValue(true);
        const request = new Request("http://localhost/login");

        await redirectIfAuthenticated(request);

        expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to custom path if provided", async () => {
        mockAccount.get.mockResolvedValue({ $id: "user1" });
        isMobileUserAgent.mockReturnValue(true);
        const request = new Request("http://localhost/login");

        await redirectIfAuthenticated(request, "/profile");

        expect(redirect).toHaveBeenCalledWith("/profile");
    });
});
