import { umamiService } from "../server";
import { umamiConfig } from "../config";

// Global fetch mock
global.fetch = jest.fn();

// Mock umamiConfig
jest.mock("../config", () => ({
    umamiConfig: {
        validate: jest.fn(),
        websiteId: "test-site-id",
        apiKey: "test-api-key",
        apiEndpoint: "https://api.umami.is/v1",
        clientUserId: "test-user-id",
        clientSecret: "test-secret",
    },
}));

describe("UmamiService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        umamiService._token = null; // Reset token
        // Ensure apiKey is reset as it's modified in some tests
        umamiConfig.apiKey = "test-api-key";
    });

    describe("getAuthHeader", () => {
        it("should return x-umami-api-key if apiKey is present", async () => {
            const header = await umamiService.getAuthHeader();
            expect(header).toEqual({ "x-umami-api-key": "test-api-key" });
        });

        it("should return Authorization header with token if apiKey is missing", async () => {
            // Setup mock config to have no API key but have client creds
            umamiConfig.apiKey = null;
            umamiService._token = "valid-token";

            const header = await umamiService.getAuthHeader();
            expect(header).toEqual({ Authorization: "Bearer valid-token" });
        });

        it("should attempt login if token is missing but client credentials exist", async () => {
            umamiConfig.apiKey = null;
            umamiService._token = null;

            // Mock login response
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: "new-token" }),
            });

            const header = await umamiService.getAuthHeader();
            expect(header).toEqual({ Authorization: "Bearer new-token" });
            expect(fetch).toHaveBeenCalledWith(
                "https://api.umami.is/v1/auth/login",
                expect.objectContaining({ method: "POST" }),
            );
        });
    });

    describe("getStats", () => {
        it("should fetch statistics correctly", async () => {
            umamiConfig.apiKey = "test-api-key";
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ viewers: 100 }),
            });

            const stats = await umamiService.getStats();

            expect(umamiConfig.validate).toHaveBeenCalled();
            expect(stats).toEqual({ viewers: 100 });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/websites/test-site-id/stats"),
                expect.objectContaining({
                    headers: { "x-umami-api-key": "test-api-key" },
                }),
            );
        });

        it("should handle 401 and retry once by clearing token", async () => {
            umamiConfig.apiKey = null;
            umamiService._token = "old-token";

            // First call fails with 401
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => "Unauthorized",
            });

            // Login for retry
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: "refreshed-token" }),
            });

            // Second call succeeds
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ viewers: 200 }),
            });

            const stats = await umamiService.getStats();

            expect(stats).toEqual({ viewers: 200 });
            expect(umamiService._token).toBe("refreshed-token");
        });
    });

    describe("getActiveUsers", () => {
        it("should fetch active users correctly", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ x: 1 }],
            });

            const active = await umamiService.getActiveUsers();

            expect(active).toEqual([{ x: 1 }]);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/websites/test-site-id/active"),
                expect.any(Object),
            );
        });
    });
});
