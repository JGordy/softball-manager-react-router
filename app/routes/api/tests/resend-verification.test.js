import { createSessionClient } from "@/utils/appwrite/server";

import { action } from "../resend-verification";

jest.mock("@/utils/appwrite/server");

describe("resend-verification API action", () => {
    const mockAccount = { createVerification: jest.fn().mockResolvedValue({}) };

    beforeEach(() => {
        jest.clearAllMocks();
        createSessionClient.mockResolvedValue({ account: mockAccount });
    });

    it("creates verification with correct URL", async () => {
        const request = new Request(
            "http://localhost/api/resend-verification",
            { method: "POST" },
        );
        const result = await action({ request });

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
        const result = await action({ request });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed");
    });
});
