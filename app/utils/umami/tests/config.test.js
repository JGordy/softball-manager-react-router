import { umamiConfig } from "../config";

describe("UmamiConfig", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset singleton internal state for each test
        umamiConfig._websiteId = null;
        umamiConfig._apiKey = null;
        umamiConfig._clientUserId = null;
        umamiConfig._clientSecret = null;
        umamiConfig._apiEndpoint = null;
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should return correct websiteId", () => {
        process.env.UMAMI_WEBSITE_ID = "site-123";
        expect(umamiConfig.websiteId).toBe("site-123");
    });

    it("should return correct apiKey", () => {
        process.env.UMAMI_API_KEY = "key-123";
        expect(umamiConfig.apiKey).toBe("key-123");
    });

    it("should return default apiEndpoint", () => {
        delete process.env.UMAMI_API_ENDPOINT;
        expect(umamiConfig.apiEndpoint).toBe("https://api.umami.is/v1");
    });

    it("should return custom apiEndpoint", () => {
        process.env.UMAMI_API_ENDPOINT = "https://my-umami.com/api";
        expect(umamiConfig.apiEndpoint).toBe("https://my-umami.com/api");
    });

    it("should validate when websiteId and apiKey are present", () => {
        process.env.UMAMI_WEBSITE_ID = "site-123";
        process.env.UMAMI_API_KEY = "key-123";

        expect(() => umamiConfig.validate()).not.toThrow();
    });

    it("should validate when websiteId and client credentials are present", () => {
        process.env.UMAMI_WEBSITE_ID = "site-123";
        delete process.env.UMAMI_API_KEY;
        process.env.UMAMI_API_CLIENT_USER_ID = "user-123";
        process.env.UMAMI_API_CLIENT_SECRET = "secret-123";

        expect(() => umamiConfig.validate()).not.toThrow();
    });

    it("should throw error if required variables are missing", () => {
        delete process.env.UMAMI_WEBSITE_ID;
        delete process.env.UMAMI_API_KEY;
        delete process.env.UMAMI_API_CLIENT_USER_ID;
        delete process.env.UMAMI_API_CLIENT_SECRET;

        expect(() => umamiConfig.validate()).toThrow(
            /Missing required Umami environment variables/,
        );
    });
});
