import { createSessionClient } from "@/utils/appwrite/server";
import { sendPushNotification } from "@/actions/notifications";
import { action } from "../test-notification";

jest.mock("@/utils/appwrite/server");
jest.mock("@/actions/notifications");

describe("test-notification API action", () => {
    let mockUser = { $id: "user-123" };
    let mockClient = {
        account: { get: jest.fn() },
        databases: {
            listDocuments: jest.fn(),
            createDocument: jest.fn(),
            updateDocument: jest.fn(),
        },
    };
    let localMockContext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { $id: "user-123" };

        localMockContext = {
            get: jest.fn((ctx) => {
                if (
                    ctx === "userContext" ||
                    String(ctx).includes("userContext")
                ) {
                    return mockUser;
                }
                return mockClient;
            }),
        };
        createSessionClient.mockResolvedValue(mockClient);
    });

    it("sends push notification if user is authenticated", async () => {
        sendPushNotification.mockResolvedValue({ success: true });

        const request = new Request("http://localhost/api/test-notification", {
            method: "POST",
        });
        const response = await action({ request, context: localMockContext });
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
        mockUser = null;

        const request = new Request("http://localhost/api/test-notification", {
            method: "POST",
        });
        const response = await action({ request, context: localMockContext });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Not authenticated");
    });
});
