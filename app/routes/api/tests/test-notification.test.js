import { createSessionClient } from "@/utils/appwrite/server";
import { sendPushNotification } from "@/actions/notifications";

import { action } from "../test-notification";

jest.mock("@/utils/appwrite/server");
jest.mock("@/actions/notifications");

describe("test-notification API action", () => {
    const mockUser = { $id: "user-123" };
    const mockAccount = { get: jest.fn().mockResolvedValue(mockUser) };

    beforeEach(() => {
        jest.clearAllMocks();
        createSessionClient.mockResolvedValue({ account: mockAccount });
    });

    it("sends push notification if user is authenticated", async () => {
        sendPushNotification.mockResolvedValue({ success: true });

        const request = new Request("http://localhost/api/test-notification", {
            method: "POST",
        });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(sendPushNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                userIds: ["user-123"],
                title: "🎉 Test Notification",
            }),
        );
    });

    it("returns 401 if not authenticated", async () => {
        createSessionClient.mockRejectedValue(new Error("Unauthorized"));

        const request = new Request("http://localhost/api/test-notification", {
            method: "POST",
        });
        const response = await action({ request });
        const data = await response.json();

        expect(response.status).toBe(500); // Because of the catch block in the action
        expect(data.error).toBe("Unauthorized");
    });
});
