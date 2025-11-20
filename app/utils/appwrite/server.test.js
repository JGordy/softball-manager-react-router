import {
    serializeSessionCookie,
    parseSessionCookie,
    createSessionClient,
    createAdminClient,
} from "./server";
import { Client, Account, Databases } from "node-appwrite";
import { appwriteConfig } from "./config";

// Mock dependencies
jest.mock("node-appwrite", () => ({
    Client: jest.fn(),
    Account: jest.fn(),
    Databases: jest.fn(),
}));

jest.mock("./config", () => ({
    appwriteConfig: {
        endpoint: "https://test.appwrite.io",
        projectId: "test-project",
        apiKey: "test-key",
        validate: jest.fn(),
    },
}));

describe("appwrite server utility", () => {
    let mockClientInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClientInstance = {
            setEndpoint: jest.fn().mockReturnThis(),
            setProject: jest.fn().mockReturnThis(),
            setSession: jest.fn().mockReturnThis(),
            setKey: jest.fn().mockReturnThis(),
        };
        Client.mockImplementation(() => mockClientInstance);
    });

    describe("serializeSessionCookie", () => {
        it("should serialize cookie correctly", () => {
            const secret = "session-secret";
            const cookie = serializeSessionCookie(secret);

            expect(cookie).toContain("appwrite-session=session-secret");
            expect(cookie).toContain("Max-Age=31536000");
            expect(cookie).toContain("Path=/");
            expect(cookie).toContain("HttpOnly");
            expect(cookie).toContain("SameSite=Lax");
        });

        it("should add Secure flag in production", () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";

            const cookie = serializeSessionCookie("secret");
            expect(cookie).toContain("Secure");

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("parseSessionCookie", () => {
        it("should parse session secret from cookie header", () => {
            const header = "other=value; appwrite-session=secret; another=val";
            const secret = parseSessionCookie(header);
            expect(secret).toBe("secret");
        });

        it("should return null if cookie not found", () => {
            const header = "other=value";
            const secret = parseSessionCookie(header);
            expect(secret).toBeNull();
        });

        it("should return null if header is missing", () => {
            const secret = parseSessionCookie(null);
            expect(secret).toBeNull();
        });
    });

    describe("createSessionClient", () => {
        it("should create client with session", async () => {
            const request = {
                headers: {
                    get: jest.fn().mockReturnValue("appwrite-session=secret"),
                },
            };

            const client = await createSessionClient(request);

            expect(appwriteConfig.validate).toHaveBeenCalled();
            expect(Client).toHaveBeenCalled();
            expect(mockClientInstance.setEndpoint).toHaveBeenCalledWith(
                "https://test.appwrite.io",
            );
            expect(mockClientInstance.setProject).toHaveBeenCalledWith(
                "test-project",
            );
            expect(mockClientInstance.setSession).toHaveBeenCalledWith(
                "secret",
            );

            expect(client.account).toBeInstanceOf(Account);
            expect(client.databases).toBeInstanceOf(Databases);
        });

        it("should create client without session if cookie missing", async () => {
            const request = {
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
            };

            await createSessionClient(request);

            expect(mockClientInstance.setSession).not.toHaveBeenCalled();
        });
    });

    describe("createAdminClient", () => {
        it("should create admin client with API key", () => {
            const client = createAdminClient();

            expect(appwriteConfig.validate).toHaveBeenCalledWith(true);
            expect(Client).toHaveBeenCalled();
            expect(mockClientInstance.setEndpoint).toHaveBeenCalledWith(
                "https://test.appwrite.io",
            );
            expect(mockClientInstance.setProject).toHaveBeenCalledWith(
                "test-project",
            );
            expect(mockClientInstance.setKey).toHaveBeenCalledWith("test-key");

            expect(client.account).toBeInstanceOf(Account);
            expect(client.databases).toBeInstanceOf(Databases);
        });
    });
});
