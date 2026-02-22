import { MemoryRouter } from "react-router";

import { render, screen } from "@/utils/test-utils";

import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";
import { umamiService } from "@/utils/umami/server";

import AdminDashboard, { loader } from "../dashboard";

// Mock Appwrite and Umami
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

jest.mock("@/utils/umami/server", () => ({
    umamiService: {
        getStats: jest.fn(),
        getActiveUsers: jest.fn(),
        getMetrics: jest.fn(),
    },
}));

// Mock react-router hooks
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
    useRevalidator: jest.fn(() => ({ state: "idle", revalidate: jest.fn() })),
    redirect: jest.fn((url) => {
        const err = new Error("redirect");
        err.url = url;
        throw err;
    }),
}));

describe("AdminDashboard Route", () => {
    const mockLoaderData = {
        stats: {
            totalUsers: 100,
            totalTeams: 10,
            totalGames: 50,
            umami: {
                pageviews: { value: 1000 },
                visitors: { value: 200 },
                bounces: { value: 50 },
                totaltime: { value: 3600 },
            },
            activeUsers: 5,
            attendance: {
                accepted: 80,
                declined: 10,
                tentative: 10,
                total: 100,
            },
        },
        recentUsers: [
            {
                $id: "signup-1",
                name: "Newbie User",
                email: "newbie@example.com",
                registration: new Date().toISOString(),
            },
        ],
        activeUsers: [
            {
                $id: "active-1",
                name: "Active User",
                email: "active@example.com",
                accessedAt: new Date().toISOString(),
            },
        ],
        activeTeams: [
            { id: "team-1", name: "Team 1", views: 100, primaryColor: "blue" },
        ],
        activeParks: [{ id: "park-1", name: "Central Park", gameCount: 15 }],
        topFeatures: [{ name: "Live Scoring", views: 200 }],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useLoaderData.mockReturnValue(mockLoaderData);
    });

    describe("loader", () => {
        it("redirects to login if user session is missing", async () => {
            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockRejectedValue(new Error()) },
            });

            try {
                await loader({ request: new Request("http://localhost/") });
            } catch (error) {
                expect(error.url).toBe("/login");
            }
        });

        it("redirects to dashboard if user is not an admin", async () => {
            createSessionClient.mockResolvedValue({
                account: { get: jest.fn().mockResolvedValue({ labels: [] }) },
            });

            try {
                await loader({ request: new Request("http://localhost/") });
            } catch (error) {
                expect(error.url).toBe("/dashboard");
            }
        });

        it("fetches data if user is an admin", async () => {
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest.fn().mockResolvedValue({ labels: ["admin"] }),
                },
            });

            const mockAdminClient = {
                users: {
                    list: jest.fn().mockResolvedValue({
                        total: 1,
                        users: [
                            {
                                $id: "1",
                                name: "U1",
                                email: "e1",
                                registration: "2024-01-01",
                                accessedAt: "2024-01-01",
                            },
                        ],
                    }),
                },
                tablesDB: {
                    listRows: jest
                        .fn()
                        .mockResolvedValue({ total: 10, rows: [] }),
                },
            };
            createAdminClient.mockReturnValue(mockAdminClient);

            umamiService.getStats.mockResolvedValue({});
            umamiService.getActiveUsers.mockResolvedValue([]);

            const result = await loader({
                request: new Request("http://localhost/"),
            });
            expect(result.recentUsers.length).toBe(1);
            expect(umamiService.getStats).toHaveBeenCalled();
        });
    });

    describe("Component", () => {
        it("renders statistics and all sub-components correctly", () => {
            render(
                <MemoryRouter>
                    <AdminDashboard />
                </MemoryRouter>,
            );

            // KPIGrid checks
            expect(screen.getAllByText("Users")[0]).toBeInTheDocument();
            expect(screen.getByText("100")).toBeInTheDocument();
            expect(screen.getAllByText("Online")[0]).toBeInTheDocument();
            expect(screen.getByText("5")).toBeInTheDocument();

            // AnalyticsSummary checks
            expect(
                screen.getByText("Umami Analytics (24h)"),
            ).toBeInTheDocument();

            // AttendanceHealth checks
            expect(screen.getByText("Show-up Rate")).toBeInTheDocument();
            expect(screen.getByText("80%")).toBeInTheDocument();

            // FeaturePopularity checks
            expect(screen.getByText(/Feature Popularity/i)).toBeInTheDocument();
            expect(screen.getByText("Live Scoring")).toBeInTheDocument();

            // ParkLeaderboard checks
            expect(screen.getByText("Park Activity")).toBeInTheDocument();
            expect(screen.getByText("Central Park")).toBeInTheDocument();

            // DashboardSection checks
            expect(screen.getByText("Most Active Teams")).toBeInTheDocument();
            expect(screen.getByText("Team 1")).toBeInTheDocument();
            expect(screen.getByText("Recent Signups")).toBeInTheDocument();
            expect(screen.getByText("Newbie User")).toBeInTheDocument();
            expect(screen.getByText("Recently Active")).toBeInTheDocument();
            expect(screen.getByText("Active User")).toBeInTheDocument();

            // Revalidator check
            expect(screen.getByText("Live")).toBeInTheDocument();
        });

        it("handles missing Umami data gracefully", () => {
            require("react-router").useLoaderData.mockReturnValue({
                ...mockLoaderData,
                stats: { ...mockLoaderData.stats, umami: null },
            });

            render(
                <MemoryRouter>
                    <AdminDashboard />
                </MemoryRouter>,
            );

            expect(
                screen.getByText("Failed to load Umami data"),
            ).toBeInTheDocument();
        });
    });
});
