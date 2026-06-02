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
        const mockClient = { account: {} };
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
        expect(data).toEqual(mockResult);
        expect(createSessionClient).toHaveBeenCalledWith(request);
        expect(updateUserPrefs).toHaveBeenCalledWith({
            values: { onboardingTours: '{"team_details":true}' },
            client: mockClient,
        });
    });

    it("should return 400 if action name is invalid", async () => {
        createSessionClient.mockResolvedValue({});
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

    it("should return 500 when client authentication or preferences update throws an exception", async () => {
        createSessionClient.mockRejectedValue(new Error("Appwrite failed"));

        const formData = new FormData();
        formData.append("_action", "update-user-preferences");

        const request = new Request("http://localhost/api/user-preferences", {
            method: "POST",
            body: formData,
        });

        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Appwrite failed");
    });
});
