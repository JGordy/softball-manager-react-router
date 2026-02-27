import { createSessionClient } from "@/utils/appwrite/server";
import { updateUser } from "@/actions/users";

import { action } from "../agreements";

jest.mock("@/actions/users", () => ({
    updateUser: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

describe("agreements API route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 405 for non-POST requests", async () => {
        const response = await action({ request: { method: "GET" } });
        expect(response.status).toBe(405);
    });

    it("returns 401 if user is not authenticated", async () => {
        createSessionClient.mockResolvedValue({
            account: { get: jest.fn().mockResolvedValue(null) },
        });

        const response = await action({ request: { method: "POST" } });
        expect(response.status).toBe(401);
    });

    it("updates user terms and returns 200 on success", async () => {
        createSessionClient.mockResolvedValue({
            account: { get: jest.fn().mockResolvedValue({ $id: "user-123" }) },
        });
        updateUser.mockResolvedValue();

        const response = await action({ request: { method: "POST" } });
        expect(updateUser).toHaveBeenCalledWith({
            userId: "user-123",
            values: { agreedToTerms: true },
        });
        expect(response.status).toBe(200);
    });
});
