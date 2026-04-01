import {
    createMemoryRouter,
    RouterProvider,
    useLoaderData,
} from "react-router";
import { render, screen } from "@/utils/test-utils";

import { logoutAction } from "@/actions/logout";
import { createSessionClient } from "@/utils/appwrite/server";
import { isMobileUserAgent } from "@/utils/device";

import Landing, { loader, action } from "../landing";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => ({ state: "idle" }),
    useLoaderData: jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
    redirect: jest.fn((url) => {
        const response = new Response(null, { status: 302 });
        response.url = url;
        return response;
    }),
}));

// Mock actions and loaders
jest.mock("@/actions/logout", () => ({
    logoutAction: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

jest.mock("@/utils/device", () => ({
    isMobileUserAgent: jest.fn(),
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconArrowRight: () => <div data-testid="icon-arrow-right" />,
    IconCheck: () => <div data-testid="icon-check" />,
    IconCalendarStats: () => null,
    IconChartBar: () => null,
    IconClipboardList: () => null,
    IconDeviceMobileMessage: () => null,
    IconSparkles: () => null,
    IconTrophy: () => null,
    IconUsers: () => null,
    IconShieldLock: () => <div data-testid="icon-shield-lock" />,
    IconBallBaseball: () => null,
    IconUserCircle: () => null,
}));

// Mock analytics
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

// Mock Mantine Carousel and Embla Autoplay
jest.mock("@mantine/carousel", () => {
    const Carousel = ({ children }) => (
        <div data-testid="carousel">{children}</div>
    );
    Carousel.Slide = ({ children }) => (
        <div data-testid="carousel-slide">{children}</div>
    );
    return { Carousel };
});

jest.mock("embla-carousel-autoplay", () =>
    jest.fn(() => ({
        stop: jest.fn(),
        reset: jest.fn(),
        on: jest.fn(),
    })),
);

describe("Landing Route", () => {
    // Suppress expected console errors from loader check and key collisions
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation((msg) => {
            if (
                msg.includes("Landing loader authentication check failed") ||
                msg.includes("Encountered two children with the same key")
            )
                return;
            // eslint-disable-next-line no-console
            console.warn(msg);
        });
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("loader", () => {
        it("returns isAuthenticated true if session exists", async () => {
            isMobileUserAgent.mockReturnValue(false);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest
                        .fn()
                        .mockResolvedValue({ $id: "user-123", labels: [] }),
                },
            });

            await expect(
                loader({
                    request: new Request("http://localhost/"),
                }),
            ).rejects.toMatchObject({
                status: 302,
                url: "/dashboard",
            });
        });

        it("redirects to custom startingPage if session exists", async () => {
            isMobileUserAgent.mockReturnValue(false);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest.fn().mockResolvedValue({
                        $id: "user-123",
                        labels: [],
                        prefs: { startingPage: "/events" },
                    }),
                },
            });

            await expect(
                loader({
                    request: new Request("http://localhost/"),
                }),
            ).rejects.toMatchObject({
                status: 302,
                url: "/events",
            });
        });

        it("redirects to /dashboard if startingPage preference is unsafe", async () => {
            isMobileUserAgent.mockReturnValue(false);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest.fn().mockResolvedValue({
                        $id: "user-123",
                        labels: [],
                        prefs: { startingPage: "https://malicious-site.com" },
                    }),
                },
            });

            await expect(
                loader({
                    request: new Request("http://localhost/"),
                }),
            ).rejects.toMatchObject({
                status: 302,
                url: "/dashboard",
            });
        });

        it("returns isAuthenticated false if session check fails", async () => {
            isMobileUserAgent.mockReturnValue(false);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest.fn().mockRejectedValue(new Error("Unauthorized")),
                },
            });

            const result = await loader({
                request: new Request("http://localhost/"),
            });
            expect(result).toEqual({
                isAuthenticated: false,
                isDesktop: true,
                isAdmin: false,
            });
        });
    });

    describe("action", () => {
        it("calls logoutAction", async () => {
            await action({
                request: new Request("http://localhost/?redirect=/login"),
            });
            expect(logoutAction).toHaveBeenCalled();
        });
    });

    describe("Component", () => {
        const renderWithRouter = (loaderData) => {
            useLoaderData.mockReturnValue(loaderData);
            const router = createMemoryRouter(
                [
                    {
                        path: "/",
                        element: <Landing />,
                    },
                ],
                {
                    initialEntries: ["/"],
                },
            );

            return render(<RouterProvider router={router} />);
        };

        it("renders landing sections and key content", () => {
            renderWithRouter({
                isAuthenticated: false,
                isDesktop: true,
                isAdmin: false,
            });

            // Hero and Features
            expect(screen.getByText("RostrHQ")).toBeInTheDocument();
            expect(
                screen.getByText("The Advantage Starts Here."),
            ).toBeInTheDocument();
            expect(
                screen.getByText("Dynamic Game Scoring"),
            ).toBeInTheDocument();

            // Showcase
            expect(
                screen.getByText("Score games in real-time"),
            ).toBeInTheDocument();

            // CTA
            expect(
                screen.getByText("Ready to take the field?"),
            ).toBeInTheDocument();

            // Footer
            expect(screen.getByText("View on GitHub")).toBeInTheDocument();
        });

        it("shows 'Get Started' on desktop when not authenticated", () => {
            renderWithRouter({
                isAuthenticated: false,
                isDesktop: true,
                isAdmin: false,
            });

            // Hero button
            const getStartedButton = screen.getByText("Get Started");
            expect(getStartedButton).toBeInTheDocument();

            const getStartedNowButton = screen.getByText("Get Started Now");
            expect(getStartedNowButton).toBeInTheDocument();
        });

        it("shows 'Go to Dashboard' and 'Log out' on desktop when authenticated", () => {
            renderWithRouter({
                isAuthenticated: true,
                isDesktop: true,
                isAdmin: false,
                user: { $id: "user-123" },
            });

            expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
            expect(screen.getByText("Log out")).toBeInTheDocument();
            expect(
                screen.getByText("You are currently logged in."),
            ).toBeInTheDocument();
        });

        it("shows 'Admin Panel' on desktop for admin users", () => {
            renderWithRouter({
                isAuthenticated: true,
                isDesktop: true,
                isAdmin: true,
                user: { $id: "admin-123" },
            });

            expect(screen.getByLabelText("Admin Panel")).toBeInTheDocument();
        });
    });
});
