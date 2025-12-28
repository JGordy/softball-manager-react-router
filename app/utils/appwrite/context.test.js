import {
    initializeAppwriteContext,
    getAppwriteClient,
    getCurrentUser,
    appwriteContext,
} from "./context";
import { createSessionClient } from "./server";

// Mock dependencies
jest.mock("./server", () => ({
    createSessionClient: jest.fn(),
}));

// Mock react createContext if it's not available in test env
jest.mock("react", () => ({
    createContext: jest.fn(() => "mock-context-key"),
}));

describe("appwrite context utility", () => {
    let mockContext;
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            set: jest.fn(),
            get: jest.fn(),
        };
        mockClient = {
            account: {
                get: jest.fn(),
            },
        };
    });

    describe("initializeAppwriteContext", () => {
        it("should create client and set it in context", async () => {
            createSessionClient.mockResolvedValue(mockClient);
            const request = { headers: { get: jest.fn() } };

            const result = await initializeAppwriteContext({
                context: mockContext,
                request,
            });

            expect(createSessionClient).toHaveBeenCalledWith(request);
            expect(mockContext.set).toHaveBeenCalledWith(
                appwriteContext,
                mockClient,
            );
            expect(result).toBe(mockClient);
        });
    });

    describe("getAppwriteClient", () => {
        it("should return client from context", () => {
            mockContext.get.mockReturnValue(mockClient);

            const result = getAppwriteClient(mockContext);

            expect(mockContext.get).toHaveBeenCalledWith(appwriteContext);
            expect(result).toBe(mockClient);
        });

        it("should throw if client not in context", () => {
            mockContext.get.mockReturnValue(undefined);

            expect(() => getAppwriteClient(mockContext)).toThrow(
                "Appwrite context not initialized",
            );
        });
    });

    describe("getCurrentUser", () => {
        it("should return user if client exists", async () => {
            mockContext.get.mockReturnValue(mockClient);
            const user = { $id: "user-id" };
            mockClient.account.get.mockResolvedValue(user);

            const result = await getCurrentUser(mockContext);

            expect(result).toBe(user);
        });

        it("should return null on error", async () => {
            mockContext.get.mockReturnValue(mockClient);
            mockClient.account.get.mockRejectedValue(new Error("Auth error"));

            const result = await getCurrentUser(mockContext);

            expect(result).toBeNull();
        });

        it("should throw if client not in context", async () => {
            mockContext.get.mockReturnValue(undefined);

            await expect(getCurrentUser(mockContext)).rejects.toThrow(
                "Appwrite context not initialized",
            );
        });
    });
});
