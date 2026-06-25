import { createSessionClient } from "@/utils/appwrite/server";
import { updateUser } from "@/actions/users";
import { mockContext } from "@/utils/mockContext";

import { action } from "../agreements";

jest.mock("@/actions/users", () => ({
    updateUser: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

describe("agreements API route", () => {
    let mockClient;
    let localMockContext;
    let mockUser = { $id: "user-123" };

    beforeEach(() => {
        mockUser = { $id: "user-123" };
        jest.clearAllMocks();
        localMockContext = {
            get: jest.fn((ctx) => {
                if (
                    ctx &&
                    (ctx.name === "userContext" ||
                        String(ctx).includes("userContext"))
                ) {
                    return mockUser;
                }
                return mockClient;
            }),
        };
    });

    it("returns 405 for non-POST requests", async () => {
        const response = await action({
            request: { method: "GET" },
            context: localMockContext,
        });
        expect(response.status).toBe(405);
    });

    it("returns 401 if user is not authenticated", async () => {
        mockUser = null;
        mockClient = {
            account: { get: jest.fn().mockResolvedValue(null) },
        };
        createSessionClient.mockResolvedValue(mockClient);

        const response = await action({
            request: { method: "POST" },
            context: localMockContext,
        });
        expect(response.status).toBe(401);
    });

    it("updates user terms and returns 200 on success", async () => {
        mockClient = {
            account: { get: jest.fn().mockResolvedValue({ $id: "user-123" }) },
        };
        createSessionClient.mockResolvedValue(mockClient);
        updateUser.mockResolvedValue();

        const response = await action({
            request: { method: "POST" },
            context: localMockContext,
        });
        expect(updateUser).toHaveBeenCalledWith({
            userId: "user-123",
            values: { agreedToTerms: true },
            client: expect.any(Object),
        });
        expect(response.status).toBe(200);
    });

    it("returns 500 when updateUser fails", async () => {
        mockClient = {
            account: { get: jest.fn().mockResolvedValue({ $id: "user-123" }) },
        };
        createSessionClient.mockResolvedValue(mockClient);
        updateUser.mockRejectedValue(new Error("Database error"));

        const request = new Request("http://localhost", { method: "POST" });
        const response = await action({ request, context: localMockContext });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Database error");
    });
});
