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

import { loader, action } from "../notifications/preferences";
import {
    subscribeToTeam,
    unsubscribeFromTeam,
    getTeamSubscriptionStatus,
} from "@/actions/notifications";

jest.mock("@/actions/notifications", () => ({
    subscribeToTeam: jest.fn(),
    unsubscribeFromTeam: jest.fn(),
    getTeamSubscriptionStatus: jest.fn(),
}));

describe("notifications/preferences API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("loader (GET)", () => {
        it("should return subscription status", async () => {
            const request = new Request(
                "http://localhost/api?teamId=t1&targetId=tgt1",
            );
            getTeamSubscriptionStatus.mockResolvedValue(true);

            const response = await loader({ request });
            const data = await response.json();

            expect(data.subscribed).toBe(true);
            expect(getTeamSubscriptionStatus).toHaveBeenCalledWith({
                teamId: "t1",
                targetId: "tgt1",
            });
        });

        it("should return 400 if params missing", async () => {
            const request = new Request("http://localhost/api?teamId=t1");
            const response = await loader({ request });
            expect(response.status).toBe(400);
        });

        it("should handle errors", async () => {
            const request = new Request(
                "http://localhost/api?teamId=t1&targetId=tgt1",
            );
            getTeamSubscriptionStatus.mockRejectedValue(new Error("Error"));
            const response = await loader({ request });
            expect(response.status).toBe(500);
        });
    });

    describe("action (POST)", () => {
        it("should handle subscribe intent", async () => {
            const formData = new FormData();
            formData.append("intent", "subscribe");
            formData.append("teamId", "t1");
            formData.append("targetId", "tgt1");

            const request = new Request("http://localhost/api", {
                method: "POST",
                body: formData,
            });

            subscribeToTeam.mockResolvedValue({});

            const response = await action({ request });
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.subscribed).toBe(true);
            expect(subscribeToTeam).toHaveBeenCalledWith({
                teamId: "t1",
                targetId: "tgt1",
            });
        });

        it("should handle unsubscribe intent", async () => {
            const formData = new FormData();
            formData.append("intent", "unsubscribe");
            formData.append("teamId", "t1");
            formData.append("targetId", "tgt1");

            const request = new Request("http://localhost/api", {
                method: "POST",
                body: formData,
            });

            unsubscribeFromTeam.mockResolvedValue({});

            const response = await action({ request });
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.subscribed).toBe(false);
            expect(unsubscribeFromTeam).toHaveBeenCalledWith({
                teamId: "t1",
                targetId: "tgt1",
            });
        });

        it("should return 400 for invalid intent", async () => {
            const formData = new FormData();
            formData.append("intent", "unknown");
            formData.append("teamId", "t1");
            formData.append("targetId", "tgt1");

            const request = new Request("http://localhost/api", {
                method: "POST",
                body: formData,
            });

            const response = await action({ request });
            expect(response.status).toBe(400);
        });

        it("should return 400 for missing fields", async () => {
            const formData = new FormData();
            formData.append("intent", "subscribe");
            // Missing teamId

            const request = new Request("http://localhost/api", {
                method: "POST",
                body: formData,
            });

            const response = await action({ request });
            expect(response.status).toBe(400);
        });
    });
});
