import { MemoryRouter, useLoaderData } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { logoutAction } from "@/actions/logout";
import { createSessionClient } from "@/utils/appwrite/server";
import { isMobileUserAgent } from "@/utils/device";

import Landing, { loader, action } from "../landing";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
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
                    get: jest.fn().mockResolvedValue({ $id: "user-123" }),
                },
            });

            const result = await loader({
                request: new Request("http://localhost/"),
            });
            expect(result).toEqual({ isAuthenticated: true, isDesktop: true });
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
            expect(result).toEqual({ isAuthenticated: false, isDesktop: true });
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
        it("renders landing sections and key content", () => {
            useLoaderData.mockReturnValue({
                isAuthenticated: false,
                isDesktop: true,
            });

            render(
                <MemoryRouter>
                    <Landing />
                </MemoryRouter>,
            );

            // Hero and Features
            expect(screen.getByText("RostrHQ")).toBeInTheDocument();
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
    });
});
