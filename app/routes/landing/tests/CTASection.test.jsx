import { render, screen } from "@/utils/test-utils";

import CTASection from "../components/CTASection";

// Mock react-router for Link
jest.mock("react-router", () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe("CTASection", () => {
    it("renders CTA text", () => {
        render(<CTASection isAuthenticated={false} isDesktop={false} />);

        expect(
            screen.getByText(/Ready to take the field?/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Simplify your softball management/i),
        ).toBeInTheDocument();
    });

    it("shows 'Get Started Now' if not authenticated and on mobile", () => {
        render(<CTASection isAuthenticated={false} isDesktop={false} />);
        expect(screen.getByText("Get Started Now")).toBeInTheDocument();
    });

    it("does not show 'Get Started Now' if authenticated", () => {
        render(<CTASection isAuthenticated={true} isDesktop={false} />);
        expect(screen.queryByText("Get Started Now")).not.toBeInTheDocument();
    });

    it("does not show 'Get Started Now' if on desktop", () => {
        render(<CTASection isAuthenticated={false} isDesktop={true} />);
        expect(screen.queryByText("Get Started Now")).not.toBeInTheDocument();
    });
});
