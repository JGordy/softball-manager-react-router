import { useNavigation } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { isMobileUserAgent, isBotUserAgent } from "@/utils/device";
import { getOrCreateUser } from "@/loaders/users";

import Layout, { loader } from "../layout";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    Outlet: jest.fn(() => <div data-testid="outlet" />),
    useNavigation: jest.fn(),
    redirect: jest.fn((url, init) => {
        const response = new Response(null, {
            status: 302,
            headers: { Location: url },
            ...init,
        });
        // Add a url property for easier testing, though standard Response doesn't have it
        response.url = url;
        return response;
    }),
}));

// Mock device utils
jest.mock("@/utils/device", () => ({
    isMobileUserAgent: jest.fn(),
    isBotUserAgent: jest.fn(),
}));

jest.mock("@/loaders/users", () => ({
    getOrCreateUser: jest.fn().mockResolvedValue({ agreedToTerms: true }),
}));

// Mock child components to simplify layout testing
jest.mock("@/components/NavLinks", () => ({
    __esModule: true,
    default: () => <div data-testid="nav-links" />,
}));
jest.mock("@/components/DesktopNavbar", () => ({
    __esModule: true,
    default: () => <div data-testid="desktop-navbar" />,
}));
jest.mock("@/components/NotificationPromptDrawer", () => ({
    __esModule: true,
    default: () => <div data-testid="notification-drawer" />,
}));
jest.mock("@/components/InstallAppDrawer", () => ({
    __esModule: true,
    default: () => <div data-testid="install-app-drawer" />,
}));

jest.mock("@/components/AgreementModal", () => ({
    __esModule: true,
    default: () => <div data-testid="agreement-modal" />,
}));

describe("Layout Route", () => {
    const mockUser = {
        $id: "user-123",
        name: "Test User",
        email: "test@example.com",
        emailVerification: true,
    };

    let localMockContext;

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigation.mockReturnValue({ state: "idle" });
        isBotUserAgent.mockReturnValue(false);

        localMockContext = {
            get: jest.fn((ctx) => {
                if (
                    (ctx && ctx.name === "userContext") ||
                    String(ctx).includes("userContext")
                ) {
                    return mockUser;
                }
                return {
                    account: { get: jest.fn().mockResolvedValue(mockUser) },
                };
            }),
        };
    });

    describe("loader", () => {
        it("allows access on non-mobile devices", async () => {
            isMobileUserAgent.mockReturnValue(false);

            const result = await loader({
                request: new Request("http://localhost/"),
                context: localMockContext,
            });
            expect(result.user).toEqual(expect.objectContaining(mockUser));
            expect(result.isMobile).toBe(false);
        });

        it("redirects to login if unauthorized (401)", async () => {
            isMobileUserAgent.mockReturnValue(true);
            const unauthMockContext = {
                get: jest.fn().mockReturnValue(null),
            };

            let thrownError;
            try {
                await loader({
                    request: new Request("http://localhost/"),
                    context: unauthMockContext,
                });
            } catch (error) {
                thrownError = error;
            }

            expect(thrownError).toBeDefined();
            expect(thrownError.url).toBe("/login");
        });

        it("redirects to auth setup if profile is incomplete", async () => {
            isMobileUserAgent.mockReturnValue(true);
            const incompleteUser = { ...mockUser, name: "User" };
            const incompleteMockContext = {
                get: jest.fn((ctx) => {
                    if (
                        (ctx && ctx.name === "userContext") ||
                        String(ctx).includes("userContext")
                    ) {
                        return incompleteUser;
                    }
                    return {};
                }),
            };

            let thrownError;
            try {
                await loader({
                    request: new Request("http://localhost/"),
                    context: incompleteMockContext,
                });
            } catch (error) {
                thrownError = error;
            }

            expect(thrownError).toBeDefined();
            expect(thrownError.url).toBe("/auth/setup");
        });

        it("returns user data when authenticated and profile complete", async () => {
            isMobileUserAgent.mockReturnValue(true);

            const result = await loader({
                request: new Request("http://localhost/"),
                context: localMockContext,
            });
            expect(result).toEqual({
                user: expect.objectContaining(mockUser),
                isAuthenticated: true,
                isVerified: true,
                isMobile: true,
            });
        });

        it("calls getOrCreateUser to fetch or self-heal user document", async () => {
            isMobileUserAgent.mockReturnValue(false);

            const mockUserDoc = {
                $id: "user-123",
                userId: "user-123",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                status: "verified",
            };
            getOrCreateUser.mockResolvedValue(mockUserDoc);

            const result = await loader({
                request: new Request("http://localhost/"),
                context: localMockContext,
            });

            expect(getOrCreateUser).toHaveBeenCalledWith({
                userId: "user-123",
                client: expect.any(Object),
            });
            expect(result.user).toEqual(expect.objectContaining(mockUserDoc));
        });
    });

    describe("Component", () => {
        const renderLayout = (
            loaderData = { user: mockUser, isAuthenticated: true },
        ) => {
            return render(<Layout loaderData={loaderData} />);
        };

        it("renders child components and Outlet", () => {
            renderLayout();

            expect(screen.getByTestId("outlet")).toBeInTheDocument();
            expect(screen.getByTestId("nav-links")).toBeInTheDocument();
            expect(screen.getByTestId("desktop-navbar")).toBeInTheDocument();
            expect(
                screen.getByTestId("notification-drawer"),
            ).toBeInTheDocument();
            expect(
                screen.getByTestId("install-app-drawer"),
            ).toBeInTheDocument();
            expect(screen.getByTestId("agreement-modal")).toBeInTheDocument();
        });

        it("shows loading overlay when navigating", () => {
            useNavigation.mockReturnValue({ state: "loading" });
            renderLayout();

            const overlay = document.querySelector('[data-overlay="layout"]');
            expect(overlay).toBeInTheDocument();
            // Mantine LoadingOverlay visibility is handled via styles/classes,
            // but we can check the visible prop was passed or it exists.
        });
    });
});
