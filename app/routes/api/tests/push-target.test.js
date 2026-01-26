// Polyfills for Web APIs in Jest environment
global.Request = class Request {
    constructor(url, init = {}) {
        this.url = url;
        this.method = init.method || "GET";
        this.body = init.body;
        this.headers = new Map();
    }
    async json() {
        return JSON.parse(this.body);
    }
    async formData() {
        return this.body;
    }
};

global.Response = class Response {
    constructor(body, init = {}) {
        this.status = init.status || 200;
        this._body = body;
    }
    async json() {
        return typeof this._body === "string"
            ? JSON.parse(this._body)
            : this._body;
    }
    static json(data, init = {}) {
        const r = new Response(data, init);
        return r;
    }
};

global.FormData = class FormData {
    constructor() {
        this.map = new Map();
    }
    append(key, value) {
        this.map.set(key, value);
    }
    get(key) {
        return this.map.get(key);
    }
};

import { loader, action } from "../push-target";
import {
    createPushTarget,
    deletePushTarget,
    getPushTarget,
    subscribeToAllTeams,
} from "@/actions/notifications";

// Mock the actions
jest.mock("@/actions/notifications", () => ({
    createPushTarget: jest.fn(),
    deletePushTarget: jest.fn(),
    getPushTarget: jest.fn(),
    subscribeToAllTeams: jest.fn(),
}));

describe("push-target API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("loader (GET)", () => {
        it("should return 400 if targetId is missing", async () => {
            const request = new Request("http://localhost/api/push-target");
            const response = await loader({ request });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe("Missing targetId");
        });

        it("should return 404 if target not found", async () => {
            const request = new Request(
                "http://localhost/api/push-target?targetId=t1",
            );
            getPushTarget.mockResolvedValue(null);

            const response = await loader({ request });

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe("Not found");
            expect(getPushTarget).toHaveBeenCalledWith({
                request: expect.any(Request), // actually passed as object property
                targetId: "t1",
            });
        });

        it("should return target if found", async () => {
            const request = new Request(
                "http://localhost/api/push-target?targetId=t1",
            );
            const mockTarget = { $id: "t1" };
            getPushTarget.mockResolvedValue(mockTarget);

            const response = await loader({ request });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.target).toEqual(mockTarget);
        });

        it("should handle errors", async () => {
            const request = new Request(
                "http://localhost/api/push-target?targetId=t1",
            );
            getPushTarget.mockRejectedValue(new Error("DB Error"));

            const response = await loader({ request });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe("DB Error");
        });
    });

    describe("action (POST/DELETE)", () => {
        it("should handle POST request to create target and auto-subscribe", async () => {
            const body = { fcmToken: "token123", providerId: "p1" };
            const request = new Request("http://localhost/api/push-target", {
                method: "POST",
                body: JSON.stringify(body),
            });

            // Mock implementation
            const mockTarget = { $id: "target123" };
            createPushTarget.mockResolvedValue(mockTarget);
            subscribeToAllTeams.mockResolvedValue({ success: true });

            const response = await action({ request });

            expect(response.status).toBe(200);
            const data = await response.json();

            // Verify steps
            expect(createPushTarget).toHaveBeenCalledWith({
                request: expect.any(Request),
                fcmToken: "token123",
                providerId: "p1",
            });

            expect(data.success).toBe(true);
            expect(data.targetId).toBe("target123");

            // Verify auto-subscription called
            expect(subscribeToAllTeams).toHaveBeenCalledWith({
                request: expect.any(Request),
                targetId: "target123",
            });
        });

        it("should handle auto-subscribe failure gracefully in POST", async () => {
            const body = { fcmToken: "token123", providerId: "p1" };
            const request = new Request("http://localhost/api/push-target", {
                method: "POST",
                body: JSON.stringify(body),
            });

            const mockTarget = { $id: "target123" };
            createPushTarget.mockResolvedValue(mockTarget);
            subscribeToAllTeams.mockRejectedValue(new Error("Sub failed"));

            const response = await action({ request });

            // Should still return success for the target creation
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.targetId).toBe("target123");

            // Error should be logged but not crashed
            expect(console.error).toHaveBeenCalledWith(
                "Auto-subscribe failed:",
                expect.any(Error),
            );
        });

        it("should handle DELETE request", async () => {
            const body = { targetId: "target123" };
            const request = new Request("http://localhost/api/push-target", {
                method: "DELETE",
                body: JSON.stringify(body),
            });

            deletePushTarget.mockResolvedValue({});

            const response = await action({ request });

            expect(response.status).toBe(200);
            expect(deletePushTarget).toHaveBeenCalledWith({
                request: expect.any(Request),
                targetId: "target123",
            });
        });

        it("should return 405 for invalid method", async () => {
            const request = new Request("http://localhost/api/push-target", {
                method: "PUT",
            });

            const response = await action({ request });
            expect(response.status).toBe(405);
        });

        it("should handle errors in action", async () => {
            const request = new Request("http://localhost/api/push-target", {
                method: "POST",
                body: JSON.stringify({}),
            });
            createPushTarget.mockRejectedValue(new Error("Fail"));

            const response = await action({ request });
            expect(response.status).toBe(500);
        });
    });
});
