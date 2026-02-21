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
            // Mock Appwrite initial stats (6 listDocuments calls in Promise.all)
            mockUsersService.list.mockResolvedValueOnce({
                total: 100,
                users: [],
            }); // stats users

            listDocuments
                .mockResolvedValueOnce({ total: 20 }) // stats teams
                .mockResolvedValueOnce({ total: 50 }) // stats games
                .mockResolvedValueOnce({ total: 200 }) // accepted attendance
                .mockResolvedValueOnce({ total: 50 }) // declined attendance
                .mockResolvedValueOnce({ total: 25 }) // tentative attendance
                .mockResolvedValueOnce({
                    rows: [
                        { $id: "g1", parkId: "park-1", seasonId: "s1" },
                        { $id: "g2", parkId: null, seasonId: "s1" }, // fallback to park-1 from season s1
                        { $id: "g3", parkId: "park-2", seasonId: "s2" },
                    ],
                }); // recent games

            // Mock Umami
            umamiService.getStats.mockResolvedValue({ views: 500 });
            umamiService.getActiveUsers.mockResolvedValue({ visitors: 5 });
            umamiService.getMetrics.mockResolvedValue([
                { x: "/team/team-1", y: 100 },
                { x: "/team/team-1/lineup", y: 50 },
                { x: "/team/team-2", y: 30 },
                { x: "/gameday/game-1", y: 200 }, // Live Scoring
                { x: "/not-a-team", y: 10 },
            ]);

            // Mock Team resolution (Sequential call 1)
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "team-1", name: "Team One", primaryColor: "blue" },
                    { $id: "team-2", name: "Team Two", primaryColor: "red" },
                ],
            });

            // Mock Season resolution (Sequential call 2) - New
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "s1", parkId: "park-1" },
                    { $id: "s2", parkId: "park-2" },
                ],
            });

            // Mock Park resolution (Sequential call 3)
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "park-1", name: "Central Park" },
                    { $id: "park-2", name: "West Park" },
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

            // Verify Attendance Metrics
            expect(result.stats.attendance.accepted).toBe(200);
            expect(result.stats.attendance.declined).toBe(50);
            expect(result.stats.attendance.tentative).toBe(25);
            // Rate logic: (accepted / (accepted + declined)) * 100 = (200 / 250) * 100 = 80
            // Note: the rate is calculated in the component, not the utility, so we just check raw counts here

            // Verify Team Aggregation
            expect(result.activeTeams).toHaveLength(2);
            expect(result.activeTeams[0]).toEqual({
                id: "team-1",
                name: "Team One",
                primaryColor: "blue",
                views: 150, // 100 + 50
            });

            // Verify Feature Popularity
            const liveScoring = result.topFeatures.find(
                (f) => f.name === "Live Scoring",
            );
            expect(liveScoring.views).toBe(200);

            // Verify Park Leaderboard
            expect(result.activeParks).toHaveLength(2);
            expect(result.activeParks[0].name).toBe("Central Park");
            expect(result.activeParks[0].gameCount).toBe(2);

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
