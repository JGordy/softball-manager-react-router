describe("AppwriteConfig", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should return environment variables", async () => {
        process.env.APPWRITE_ENDPOINT = "https://test.appwrite.io/v1";
        process.env.APPWRITE_PROJECT_ID = "test-project";
        process.env.APPWRITE_API_KEY = "test-key";

        const { appwriteConfig } = await import("./config");

        expect(appwriteConfig.endpoint).toBe("https://test.appwrite.io/v1");
        expect(appwriteConfig.projectId).toBe("test-project");
        expect(appwriteConfig.apiKey).toBe("test-key");
    });

    it("should validate required variables", async () => {
        process.env.APPWRITE_ENDPOINT = "https://test.appwrite.io/v1";
        process.env.APPWRITE_PROJECT_ID = "test-project";
        // API Key missing

        const { appwriteConfig } = await import("./config");

        // Should not throw if API key is not required
        expect(() => appwriteConfig.validate(false)).not.toThrow();

        // Should throw if API key is required
        expect(() => appwriteConfig.validate(true)).toThrow(
            "Missing required Appwrite environment variables: APPWRITE_API_KEY",
        );
    });

    it("should throw if endpoint or project ID is missing", async () => {
        delete process.env.APPWRITE_ENDPOINT;
        delete process.env.APPWRITE_PROJECT_ID;

        const { appwriteConfig } = await import("./config");

        expect(() => appwriteConfig.validate(false)).toThrow(
            "Missing required Appwrite environment variables: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID",
        );
    });
});
