import { MemoryRouter } from "react-router";

import { render, screen } from "@/utils/test-utils";

import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";
import { mockContext } from "@/utils/mockContext";

import AdminDashboard, { loader } from "../dashboard";

// Mock Appwrite
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
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
        activeParks: [{ id: "park-1", name: "Central Park", gameCount: 15 }],
        range: "24h",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useLoaderData.mockReturnValue(mockLoaderData);
    });

    describe("loader", () => {
        it("redirects to login if user session is missing", async () => {
            const localMockContext = {
                get: jest.fn(() => null),
            };

            try {
                await loader({
                    request: new Request("http://localhost/"),
                    context: localMockContext,
                });
            } catch (error) {
                expect(error.url).toBe("/login");
            }
        });

        it("redirects to dashboard if user is not an admin", async () => {
            const localMockContext = {
                get: jest.fn((ctx) => {
                    if (
                        ctx === "userContext" ||
                        String(ctx).includes("userContext")
                    ) {
                        return { labels: [] };
                    }
                    return {};
                }),
            };

            try {
                await loader({
                    request: new Request("http://localhost/"),
                    context: localMockContext,
                });
            } catch (error) {
                expect(error.url).toBe("/dashboard");
            }
        });

        it("fetches data if user is an admin", async () => {
            const localMockContext = {
                get: jest.fn((ctx) => {
                    if (
                        ctx === "userContext" ||
                        String(ctx).includes("userContext")
                    ) {
                        return { labels: ["admin"] };
                    }
                    return {};
                }),
            };

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

            const result = await loader({
                request: new Request("http://localhost/"),
                context: localMockContext,
            });
            expect(result.recentUsers.length).toBe(1);
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

            // ParkLeaderboard checks
            expect(screen.getByText("Park Activity")).toBeInTheDocument();
            expect(screen.getByText("Central Park")).toBeInTheDocument();

            // DashboardSection checks
            expect(screen.getByText("Recent Signups")).toBeInTheDocument();
            expect(screen.getByText("Newbie User")).toBeInTheDocument();
            expect(screen.getByText("Recently Active")).toBeInTheDocument();
            expect(screen.getByText("Active User")).toBeInTheDocument();

            // Revalidator check
            expect(screen.getByText("Live")).toBeInTheDocument();

            // External Tools Menu check
            expect(
                screen.getByRole("button", { name: /external tools/i }),
            ).toBeInTheDocument();
        });
    });
});
