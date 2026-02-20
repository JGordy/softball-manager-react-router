import { listDocuments } from "@/utils/databases";
import { umamiService } from "@/utils/umami/server";
import { getAdminDashboardData } from "../dashboard";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
}));

jest.mock("@/utils/umami/server", () => ({
    umamiService: {
        getStats: jest.fn(),
        getActiveUsers: jest.fn(),
        getMetrics: jest.fn(),
    },
}));

describe("Admin Dashboard Utils", () => {
    const mockUsersService = {
        list: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getAdminDashboardData", () => {
        it("fetches and aggregates data correctly", async () => {
            // Mock Appwrite initial stats
            mockUsersService.list.mockResolvedValueOnce({
                total: 100,
                users: [],
            }); // stats users
            listDocuments.mockResolvedValueOnce({ total: 20 }); // stats teams
            listDocuments.mockResolvedValueOnce({ total: 50 }); // stats games

            // Mock Umami
            umamiService.getStats.mockResolvedValue({ views: 500 });
            umamiService.getActiveUsers.mockResolvedValue({ visitors: 5 });
            umamiService.getMetrics.mockResolvedValue([
                { x: "/team/team-1", y: 100 },
                { x: "/team/team-1/lineup", y: 50 },
                { x: "/team/team-2", y: 30 },
                { x: "/not-a-team", y: 10 },
            ]);

            // Mock Team resolution
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "team-1", name: "Team One", primaryColor: "blue" },
                    { $id: "team-2", name: "Team Two", primaryColor: "red" },
                ],
            });

            // Mock final users fetch
            mockUsersService.list.mockResolvedValueOnce({
                users: [
                    {
                        $id: "u1",
                        registration: "2024-01-01",
                        accessedAt: "2024-01-02",
                    },
                    {
                        $id: "u2",
                        registration: "2024-01-02",
                        accessedAt: "2024-01-01",
                    },
                ],
            });

            const result = await getAdminDashboardData({
                users: mockUsersService,
            });

            // Verify Stats
            expect(result.stats.totalUsers).toBe(100);
            expect(result.stats.totalTeams).toBe(20);
            expect(result.stats.totalGames).toBe(50);
            expect(result.stats.activeUsers).toBe(5);

            // Verify Team Aggregation
            expect(result.activeTeams).toHaveLength(2);
            expect(result.activeTeams[0]).toEqual({
                id: "team-1",
                name: "Team One",
                primaryColor: "blue",
                views: 150, // 100 + 50
            });

            // Verify User lists
            expect(result.recentUsers[0].$id).toBe("u2"); // 2024-01-02 is more recent
            expect(result.activeUsers[0].$id).toBe("u1"); // 2024-01-02 is more recent activity
        });

        it("handles missing Umami data gracefully", async () => {
            mockUsersService.list.mockResolvedValue({ total: 0, users: [] });
            listDocuments.mockResolvedValue({ total: 0, rows: [] });
            umamiService.getStats.mockResolvedValue(null);
            umamiService.getActiveUsers.mockResolvedValue(null);
            umamiService.getMetrics.mockResolvedValue([]);

            const result = await getAdminDashboardData({
                users: mockUsersService,
            });

            expect(result.stats.umami).toBeNull();
            expect(result.stats.activeUsers).toBe(0);
            expect(result.activeTeams).toEqual([]);
        });

        it("handles Umami service errors gracefully", async () => {
            mockUsersService.list.mockResolvedValue({ total: 10, users: [] });
            listDocuments.mockResolvedValue({ total: 5, rows: [] });

            // Umami service throws
            umamiService.getStats.mockRejectedValue(new Error("Umami Down"));
            umamiService.getActiveUsers.mockResolvedValue({ visitors: 5 });
            umamiService.getMetrics.mockResolvedValue([]);

            const result = await getAdminDashboardData({
                users: mockUsersService,
            });

            // Appwrite data should still be there
            expect(result.stats.totalUsers).toBe(10);
            expect(result.stats.totalTeams).toBe(5);

            // Umami data should be defaulted
            expect(result.stats.umami).toBeNull();
            expect(result.stats.activeUsers).toBe(0);
            expect(result.activeTeams).toEqual([]);
        });
    });
});
