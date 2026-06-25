import { loader } from "../stats";
import { getStatsByUserId } from "@/loaders/users";
import { createSessionClient } from "@/utils/appwrite/server";
import { mockContext } from "@/utils/mockContext";

// Mock the user loader
jest.mock("@/loaders/users", () => ({
    getStatsByUserId: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

describe("stats API", () => {
    let mockAccount;
    let localMockContext;
    let mockClient;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console.error for expected error tests
        jest.spyOn(console, "error").mockImplementation(() => {});

        mockAccount = {
            get: jest.fn(),
        };

        mockClient = { account: mockAccount };
        mockUser = { $id: "123" };

        localMockContext = {
            get: jest.fn((ctx) => {
                if (
                    ctx === "userContext" ||
                    String(ctx).includes("userContext") ||
                    (ctx && ctx.name === "userContext")
                ) {
                    return mockUser;
                }
                return mockClient;
            }),
        };
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("loader (GET)", () => {
        it("should return 401 if user is not logged in", async () => {
            mockUser = null;

            const request = new Request("http://localhost/api/stats");
            const response = await loader({
                request,
                context: localMockContext,
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe("Unauthorized");
        });

        it("should return the stats for the logged in user", async () => {
            mockUser = { $id: "123" };
            const mockStats = {
                logs: [{ id: 1 }],
                games: [],
                teams: [],
            };
            getStatsByUserId.mockResolvedValue(mockStats);

            const request = new Request("http://localhost/api/stats");
            const response = await loader({
                request,
                context: localMockContext,
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual(mockStats);
            expect(getStatsByUserId).toHaveBeenCalledWith({
                userId: "123",
                client: expect.any(Object),
            });
        });

        it("should return 500 if getting stats fails", async () => {
            mockUser = { $id: "123" };
            getStatsByUserId.mockRejectedValue(new Error("Database error"));

            const request = new Request("http://localhost/api/stats");
            const response = await loader({
                request,
                context: localMockContext,
            });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe("Failed to fetch stats");
        });
    });
});
