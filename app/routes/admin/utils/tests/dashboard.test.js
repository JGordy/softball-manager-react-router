import { listDocuments } from "@/utils/databases";
import { getAdminDashboardData } from "../dashboard";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
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

            // Mock Season resolution (Sequential call 1) - New
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "s1", parkId: "park-1" },
                    { $id: "s2", parkId: "park-2" },
                ],
            });

            // Mock Park resolution (Sequential call 2)
            listDocuments.mockResolvedValueOnce({
                rows: [
                    { $id: "park-1", displayName: "Central Park" },
                    { $id: "park-2", displayName: "West Park" },
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
                    { $id: "park-1", displayName: "Central Park" },
                    { $id: "park-2", displayName: "West Park" },
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
            expect(result.stats.activeUsers).toBe(2);

            // Verify Attendance Metrics
            expect(result.stats.attendance.accepted).toBe(200);
            expect(result.stats.attendance.declined).toBe(50);
            expect(result.stats.attendance.tentative).toBe(25);
            // Rate logic in AttendanceHealth: (accepted / total) * 100 where total includes tentative
            // With this mock data: (200 / 275) * 100 ≈ 72.7. The rate is calculated in the component,
            // so here we only verify the raw attendance counts.

            // Verify Park Leaderboard
            expect(result.activeParks).toHaveLength(2);
            expect(result.activeParks[0].name).toBe("Central Park");
            expect(result.activeParks[0].gameCount).toBe(2);

            // Verify User lists
            expect(result.recentUsers[0].$id).toBe("u2"); // 2024-01-02 is more recent
            expect(result.activeUsers[0].$id).toBe("u1"); // 2024-01-02 is more recent activity

            expect(result.range).toBe("24h");
        });

        it("normalizes and respects different time ranges", async () => {
            mockUsersService.list.mockResolvedValue({ total: 0, users: [] });
            listDocuments.mockResolvedValue({ total: 0, rows: [] });

            const result7d = await getAdminDashboardData({
                users: mockUsersService,
                range: "7d",
            });
            expect(result7d.range).toBe("7d");

            const resultInvalid = await getAdminDashboardData({
                users: mockUsersService,
                range: "invalid",
            });
            expect(resultInvalid.range).toBe("24h");
        });

        it("validates and normalizes ranges correctly", async () => {
            mockUsersService.list.mockResolvedValue({ total: 10, users: [] });
            listDocuments.mockResolvedValue({ total: 5, rows: [] });

            // 1. Valid range (7d)
            const result7d = await getAdminDashboardData({
                users: mockUsersService,
                range: "7d",
            });
            expect(result7d.range).toBe("7d");

            // 2. Invalid range (foo) -> defaults to 24h
            const resultInvalid = await getAdminDashboardData({
                users: mockUsersService,
                range: "foo",
            });
            expect(resultInvalid.range).toBe("24h");
        });
    });
});
