import { render, screen, fireEvent } from "@/utils/test-utils";

import { trackEvent } from "@/utils/analytics";

import SupportPanel from "../components/SupportPanel";

// Mock analytics
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("SupportPanel Component", () => {
    it("renders support email link", () => {
        render(<SupportPanel />);

        const link = screen.getByRole("link", {
            name: /support@rostrhq\.app/i,
        });
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe("A");
        expect(link).toHaveAttribute("href", "mailto:support@rostrhq.app");
    });

    it("tracks click on support link", () => {
        render(<SupportPanel />);

        fireEvent.click(
            screen.getByRole("link", { name: /support@rostrhq\.app/i }),
        );
        expect(trackEvent).toHaveBeenCalledWith("email-support");
    });
});
