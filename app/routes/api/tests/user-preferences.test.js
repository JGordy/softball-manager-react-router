import { action } from "../user-preferences";
import { createSessionClient } from "@/utils/appwrite/server";
import { updateUserPrefs } from "@/actions/users";

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("@/actions/users", () => ({
    updateUserPrefs: jest.fn(),
}));

describe("user-preferences API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it("should reject non-POST methods with 405 status", async () => {
        const request = new Request("http://localhost/api/user-preferences", {
            method: "GET",
        });

        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(405);
        expect(data.error).toBe("Method not allowed");
    });

    it("should successfully execute updateUserPrefs when action is update-user-preferences", async () => {
        const mockGet = jest.fn().mockResolvedValue({ $id: "user1" });
        const mockClient = { account: { get: mockGet } };
        createSessionClient.mockResolvedValue(mockClient);

        const mockResult = {
            success: true,
            status: 204,
            message: "Preferences updated successfully.",
        };
        updateUserPrefs.mockResolvedValue(mockResult);

        const formData = new FormData();
        formData.append("_action", "update-user-preferences");
        formData.append("userId", "u1");
        formData.append("onboardingTours", '{"team_details":true}');

        const request = new Request("http://localhost/api/user-preferences", {
            method: "POST",
            body: formData,
        });

        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
            success: true,
            status: 200,
            message: "Preferences updated successfully.",
        });
        expect(createSessionClient).toHaveBeenCalledWith(request);
        expect(mockGet).toHaveBeenCalled();
        expect(updateUserPrefs).toHaveBeenCalledWith({
            values: { onboardingTours: '{"team_details":true}' },
            client: mockClient,
        });
    });

    it("should return 401 if user is not authenticated or account.get throws", async () => {
        const mockGet = jest
            .fn()
            .mockRejectedValue(new Error("Unauthenticated"));
        const mockClient = { account: { get: mockGet } };
        createSessionClient.mockResolvedValue(mockClient);

        const formData = new FormData();
        formData.append("_action", "update-user-preferences");

        const request = new Request("http://localhost/api/user-preferences", {
            method: "POST",
            body: formData,
        });

        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if action name is invalid", async () => {
        const mockGet = jest.fn().mockResolvedValue({ $id: "user1" });
        const mockClient = { account: { get: mockGet } };
        createSessionClient.mockResolvedValue(mockClient);

        const formData = new FormData();
        formData.append("_action", "invalid-action");

        const request = new Request("http://localhost/api/user-preferences", {
            method: "POST",
            body: formData,
        });

        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid action");
    });

    it("should return 500 when client authentication throws an exception not related to session client", async () => {
        // Here we simulate an unexpected error in the main block (e.g. request.formData throws or similar)
        // or createSessionClient throws a general error. If createSessionClient throws,
        // it is caught by the inner block, which returns 401. So to trigger the outer catch (500),
        // we can mock request.formData to throw.
        const request = new Request("http://localhost/api/user-preferences", {
            method: "POST",
        });
        jest.spyOn(request, "formData").mockRejectedValue(
            new Error("Form data error"),
        );

        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Form data error");
    });
});
