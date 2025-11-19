import { logoutAction } from "./logout";
import { createSessionClient } from "@/utils/appwrite/server";

// Mock dependencies
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("react-router", () => ({
    redirect: jest.fn((path, options) => ({ redirect: path, ...options })),
}));

describe("Logout Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe("logoutAction", () => {
        it("should delete session and redirect to login", async () => {
            const mockDeleteSession = jest.fn().mockResolvedValue({});
            createSessionClient.mockResolvedValue({
                account: { deleteSession: mockDeleteSession },
            });

            const result = await logoutAction({ request: {} });

            expect(mockDeleteSession).toHaveBeenCalledWith("current");
            expect(result.redirect).toBe("/login");
            expect(result.headers["Set-Cookie"]).toContain("Max-Age=0");
        });

        it("should handle session deletion errors gracefully", async () => {
            const mockDeleteSession = jest
                .fn()
                .mockRejectedValue(new Error("Session error"));
            createSessionClient.mockResolvedValue({
                account: { deleteSession: mockDeleteSession },
            });

            const result = await logoutAction({ request: {} });

            expect(result.redirect).toBe("/login");
            expect(console.log).toHaveBeenCalled();
        });
    });
});
