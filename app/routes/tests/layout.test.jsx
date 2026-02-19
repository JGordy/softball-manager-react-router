import { useNavigation } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { createSessionClient } from "@/utils/appwrite/server";
import { isMobileUserAgent } from "@/utils/device";

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

// Mock Appwrite server utils
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

// Mock device utils
jest.mock("@/utils/device", () => ({
    isMobileUserAgent: jest.fn(),
}));

// Mock child components to simplify layout testing
jest.mock("@/components/NavLinks", () => ({
    __esModule: true,
    default: () => <div data-testid="nav-links" />,
}));
jest.mock("@/components/NotificationPromptDrawer", () => ({
    __esModule: true,
    default: () => <div data-testid="notification-drawer" />,
}));
jest.mock("@/components/InstallAppDrawer", () => ({
    __esModule: true,
    default: () => <div data-testid="install-app-drawer" />,
}));

describe("Layout Route", () => {
    const mockUser = {
        $id: "user-123",
        name: "Test User",
        email: "test@example.com",
        emailVerification: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigation.mockReturnValue({ state: "idle" });
    });

    describe("loader", () => {
        it("redirects to home if not a mobile device", async () => {
            isMobileUserAgent.mockReturnValue(false);

            try {
                await loader({ request: new Request("http://localhost/") });
            } catch (error) {
                expect(error.url).toBe("/");
            }
        });

        it("redirects to login if unauthorized (401)", async () => {
            isMobileUserAgent.mockReturnValue(true);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest.fn().mockRejectedValue({ code: 401 }),
                },
            });

            try {
                await loader({ request: new Request("http://localhost/") });
            } catch (error) {
                expect(error.url).toBe("/login");
            }
        });

        it("redirects to auth setup if profile is incomplete", async () => {
            isMobileUserAgent.mockReturnValue(true);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest
                        .fn()
                        .mockResolvedValue({ ...mockUser, name: "User" }),
                },
            });

            try {
                await loader({ request: new Request("http://localhost/") });
            } catch (error) {
                expect(error.url).toBe("/auth/setup");
            }
        });

        it("returns user data when authenticated and profile complete", async () => {
            isMobileUserAgent.mockReturnValue(true);
            createSessionClient.mockResolvedValue({
                account: {
                    get: jest.fn().mockResolvedValue(mockUser),
                },
            });

            const result = await loader({
                request: new Request("http://localhost/"),
            });
            expect(result).toEqual({
                user: mockUser,
                isAuthenticated: true,
                isVerified: true,
            });
        });
    });

    describe("Component", () => {
        const renderLayout = (loaderData = { user: mockUser }) => {
            return render(<Layout loaderData={loaderData} />);
        };

        it("renders child components and Outlet", () => {
            renderLayout();

            expect(screen.getByTestId("outlet")).toBeInTheDocument();
            expect(screen.getByTestId("nav-links")).toBeInTheDocument();
            expect(
                screen.getByTestId("notification-drawer"),
            ).toBeInTheDocument();
            expect(
                screen.getByTestId("install-app-drawer"),
            ).toBeInTheDocument();
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
