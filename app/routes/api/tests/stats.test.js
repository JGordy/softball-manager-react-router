import { loader } from "../stats";
import { getStatsByUserId } from "@/loaders/users";

// Mock the user loader
jest.mock("@/loaders/users", () => ({
    getStatsByUserId: jest.fn(),
}));

describe("stats API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console.error for expected error tests
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("loader (GET)", () => {
        it("should return 400 if userId is missing", async () => {
            const request = new Request("http://localhost/api/stats");
            const response = await loader({ request });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe("UserId is required");
        });

        it("should return the stats if userId is provided", async () => {
            const mockStats = {
                logs: [{ id: 1 }],
                games: [],
                teams: [],
            };
            getStatsByUserId.mockResolvedValue(mockStats);

            const request = new Request(
                "http://localhost/api/stats?userId=123",
            );
            const response = await loader({ request });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toEqual(mockStats);
            expect(getStatsByUserId).toHaveBeenCalledWith({ userId: "123" });
        });

        it("should return 500 if getting stats fails", async () => {
            getStatsByUserId.mockRejectedValue(new Error("Database error"));

            const request = new Request(
                "http://localhost/api/stats?userId=123",
            );
            const response = await loader({ request });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.error).toBe("Failed to fetch stats");
        });
    });
});
