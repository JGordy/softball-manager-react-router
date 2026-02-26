import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import HeroSection from "../components/HeroSection";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
    useSubmit: () => jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
}));

describe("HeroSection", () => {
    it("renders branding name and tagline", () => {
        render(
            <MemoryRouter>
                <HeroSection isAuthenticated={false} isDesktop={true} />
            </MemoryRouter>,
        );

        expect(screen.getByText(/RostrHQ/i)).toBeInTheDocument();
    });

    it("shows 'Go to Dashboard' if authenticated and on mobile", () => {
        render(
            <MemoryRouter>
                <HeroSection isAuthenticated={true} isDesktop={false} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    });

    it("shows switch to phone message if authenticated on desktop", () => {
        render(
            <MemoryRouter>
                <HeroSection isAuthenticated={true} isDesktop={true} />
            </MemoryRouter>,
        );

        expect(
            screen.getByText(
                /Please switch to your phone to access the dashboard/i,
            ),
        ).toBeInTheDocument();
    });

    it("shows 'Get Started' if not authenticated on mobile", () => {
        render(
            <MemoryRouter>
                <HeroSection isAuthenticated={false} isDesktop={false} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Get Started")).toBeInTheDocument();
    });

    it("shows desktop message if not authenticated on desktop", () => {
        render(
            <MemoryRouter>
                <HeroSection isAuthenticated={false} isDesktop={true} />
            </MemoryRouter>,
        );

        expect(
            screen.getByText(/Please switch to your phone to get started/i),
        ).toBeInTheDocument();
    });

    it("shows 'Go to Dashboard' and doesn't show phone message if authenticated admin on desktop", () => {
        render(
            <MemoryRouter>
                <HeroSection
                    isAuthenticated={true}
                    isDesktop={true}
                    isAdmin={true}
                />
            </MemoryRouter>,
        );

        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
        expect(
            screen.queryByText(
                /Please switch to your phone to access the dashboard/i,
            ),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText("You are currently logged in."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /admin/i }),
        ).toBeInTheDocument();
    });

    it("shows 'Go to Dashboard' and admin button if authenticated admin on mobile", () => {
        render(
            <MemoryRouter>
                <HeroSection
                    isAuthenticated={true}
                    isDesktop={false}
                    isAdmin={true}
                />
            </MemoryRouter>,
        );

        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
        expect(
            screen.getByText("You are currently logged in."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /admin/i }),
        ).toBeInTheDocument();
    });
});
