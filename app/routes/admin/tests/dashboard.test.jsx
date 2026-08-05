import { MemoryRouter } from "react-router";

import { render, screen } from "@/utils/test-utils";

import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";
import { mockContext } from "@/utils/mockContext";
import { Presences } from "node-appwrite";

import AdminDashboard, { loader } from "../dashboard";

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(
            (attr, val) => `equal("${attr}", ${JSON.stringify(val)})`,
        ),
        isNotNull: jest.fn((attr) => `isNotNull("${attr}")`),
        select: jest.fn((attrs) => `select(${JSON.stringify(attrs)})`),
        limit: jest.fn((l) => `limit(${l})`),
        orderDesc: jest.fn((attr) => `orderDesc("${attr}")`),
        orderAsc: jest.fn((attr) => `orderAsc("${attr}")`),
    },
    Presences: jest.fn().mockImplementation(() => ({
        list: jest.fn().mockResolvedValue({ total: 0, presences: [] }),
    })),
}));

// Mock react-router hooks
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
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
                teams: {
                    list: jest.fn().mockResolvedValue({ teams: [], total: 0 }),
                },
                messaging: {
                    listMessages: jest
                        .fn()
                        .mockResolvedValue({ messages: [], total: 0 }),
                },
                functions: {
                    list: jest
                        .fn()
                        .mockResolvedValue({ functions: [], total: 0 }),
                    listExecutions: jest
                        .fn()
                        .mockResolvedValue({ executions: [], total: 0 }),
                },
                client: {},
            };
            createAdminClient.mockReturnValue(mockAdminClient);

            const result = await loader({
                request: new Request("http://localhost/"),
                context: localMockContext,
            });
            expect(result.recentUsers.length).toBe(1);
        });

        it("fetches active online users count from Appwrite presences", async () => {
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
                        users: [],
                    }),
                },
                tablesDB: {
                    listRows: jest
                        .fn()
                        .mockResolvedValue({ total: 10, rows: [] }),
                },
                teams: {
                    list: jest.fn().mockResolvedValue({ teams: [], total: 0 }),
                },
                messaging: {
                    listMessages: jest
                        .fn()
                        .mockResolvedValue({ messages: [], total: 0 }),
                },
                functions: {
                    list: jest
                        .fn()
                        .mockResolvedValue({ functions: [], total: 0 }),
                    listExecutions: jest
                        .fn()
                        .mockResolvedValue({ executions: [], total: 0 }),
                },
                client: {},
            };
            createAdminClient.mockReturnValue(mockAdminClient);

            const mockList = jest
                .fn()
                .mockResolvedValue({ total: 42, presences: [] });
            Presences.mockImplementation(() => ({
                list: mockList,
            }));

            const result = await loader({
                request: new Request("http://localhost/"),
                context: localMockContext,
            });
            expect(result.stats.activeUsers).toBe(42);
            expect(mockList).toHaveBeenCalledWith({
                queries: [
                    expect.stringContaining('equal("status", ["online"])'),
                ],
            });
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
            expect(screen.getByText("Field Hubs")).toBeInTheDocument();
            expect(screen.getByText("Central Park")).toBeInTheDocument();

            // UserDirectory checks
            expect(screen.getByText("User Directory")).toBeInTheDocument();
            expect(screen.getByText("Newest Signups")).toBeInTheDocument();
            expect(screen.getByText("Newbie User")).toBeInTheDocument();
            expect(screen.getByText("Recently Active")).toBeInTheDocument();
            expect(screen.getByText("Active User")).toBeInTheDocument();

            // External Tools Panel check
            expect(screen.getByText(/external services/i)).toBeInTheDocument();
            expect(
                screen.getByRole("link", { name: /appwrite/i }),
            ).toBeInTheDocument();
        });
    });
});
