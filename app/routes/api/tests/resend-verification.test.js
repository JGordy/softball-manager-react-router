import { createSessionClient } from "@/utils/appwrite/server";

let mockUser = { $id: "user-123", email: "test@example.com" };
let mockAccount = { createVerification: jest.fn().mockResolvedValue({}) };
let localMockContext;

beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { $id: "user-123", email: "test@example.com" };
    mockAccount = { createVerification: jest.fn().mockResolvedValue({}) };

    localMockContext = {
        get: jest.fn((ctx) => {
            if (ctx === "userContext" || String(ctx).includes("userContext")) {
                return mockUser;
            }
            return {
                account: mockAccount,
            };
        }),
    };
});

import { action } from "../resend-verification";

jest.mock("@/utils/appwrite/server");

describe("resend-verification API action", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createSessionClient.mockResolvedValue({ account: mockAccount });
    });

    it("creates verification with correct URL", async () => {
        const request = new Request(
            "http://localhost/api/resend-verification",
            { method: "POST" },
        );
        const result = await action({ request, context: localMockContext });

        expect(result.success).toBe(true);
        expect(mockAccount.createVerification).toHaveBeenCalledWith(
            "http://localhost/verify",
        );
    });

    it("returns error on failure", async () => {
        mockAccount.createVerification.mockRejectedValue(new Error("Failed"));
        const request = new Request(
            "http://localhost/api/resend-verification",
            { method: "POST" },
        );
        const result = await action({ request, context: localMockContext });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed");
    });
});
