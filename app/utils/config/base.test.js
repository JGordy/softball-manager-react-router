import { BaseConfig } from "./base";

describe("BaseConfig", () => {
    let config;
    const originalEnv = process.env;

    beforeEach(() => {
        config = new BaseConfig();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should lazily load environment variables", () => {
        process.env.TEST_KEY = "test-value";

        // Before access
        expect(config._test).toBeUndefined();

        // Access
        const val = config.getEnv("_test", "TEST_KEY");
        expect(val).toBe("test-value");
        expect(config._test).toBe("test-value");
    });

    it("should return default value if env var is missing", () => {
        delete process.env.TEST_KEY;
        const val = config.getEnv("_test", "TEST_KEY", "default");
        expect(val).toBe("default");
        expect(config._test).toBe("default");
    });

    it("should throw error if required variables are missing", () => {
        const checks = [
            { label: "VAR1", value: "exists" },
            { label: "VAR2", value: undefined },
        ];

        expect(() => config.throwIfMissing("TestService", checks)).toThrow(
            "Missing required TestService environment variables: VAR2",
        );
    });

    it("should not throw if all required variables are present", () => {
        const checks = [
            { label: "VAR1", value: "exists" },
            { label: "VAR2", value: "also exists" },
        ];

        expect(() =>
            config.throwIfMissing("TestService", checks),
        ).not.toThrow();
    });
});
